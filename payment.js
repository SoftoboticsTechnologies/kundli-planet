/* Kundli Planet - Razorpay payment wrapper for paid downloads.
   Plain global-scope script (no bundler on this site - see support.js).
   Exposes window.KPPayment.

   Uses the Razorpay Orders flow with server-side verification
   (functions/api/payments/ - Cloudflare Pages Functions):
     1. server creates the Order (amount is set on the server, not here)
     2. Checkout opens with that order_id
     3. server verifies the signature and the Payment entity
        (status "captured", matching order_id / amount) before we resolve.
   No Razorpay key or secret lives in this file - the server returns the
   public key_id along with the order. */
(function (global) {
  "use strict";

  var CONFIG = {
    // Payment API is served by Cloudflare Pages Functions under /api on the
    // same origin as this site (see functions/api/payments/). Run
    // `wrangler pages dev .` locally so /api works there too.
    apiBase: "",
    businessName: "Kundli Planet",
    themeColor: "#C79A20",
    logo: new URL("./Kundli%20planet%20assets/favicon_io/android-chrome-192x192.png", global.location.href).href,
    // Display prices in rupees (button label only). The amount actually
    // charged comes from PRICES in server/payment-server.js - keep in sync.
    prices: {
      kundliPdf: 249
    }
  };

  var CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
  var checkoutPromise = null;

  function loadCheckout() {
    if (global.Razorpay) return Promise.resolve();
    if (checkoutPromise) return checkoutPromise;
    checkoutPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = CHECKOUT_SRC;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () {
        checkoutPromise = null;
        s.remove();
        reject(new Error("Could not load Razorpay checkout"));
      };
      document.head.appendChild(s);
    });
    return checkoutPromise;
  }

  function withCode(err, code) { return Object.assign(err instanceof Error ? err : new Error(String(err)), { code: code }); }

  // POST JSON to the payment server. Network failure -> code "load";
  // an error response -> code `errCode` with the server's description.
  function api(path, body, errCode) {
    return fetch(CONFIG.apiBase + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch(function (e) {
      throw withCode(e, "load");
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw withCode(new Error((data.error && data.error.description) || "Payment server error"), errCode);
        return data;
      });
    });
  }

  // Runs the full paid flow for a product.
  // Resolves with the verified payment { paymentId, orderId, amount, currency, method, status }.
  // Rejects with an Error whose .code is:
  //   "load"      checkout script or payment server unreachable
  //   "server"    server could not create the order (e.g. bad API keys)
  //   "dismissed" user closed checkout without paying
  //   "verify"    payment made but could not be verified (.paymentId is set)
  function pay(product, opts) {
    opts = opts || {};
    return Promise.all([
      loadCheckout().catch(function (e) { throw withCode(e, "load"); }),
      api("/api/payments/order", { product: product, notes: opts.notes || {} }, "server")
    ]).then(function (r) {
      var order = r[1];
      return new Promise(function (resolve, reject) {
        var settled = false;
        var rzp = new global.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: CONFIG.businessName,
          description: opts.description || order.label || "",
          image: CONFIG.logo,
          prefill: opts.prefill || {},
          notes: opts.notes || {},
          theme: { color: CONFIG.themeColor },
          handler: function (resp) {
            settled = true;
            api("/api/payments/verify", resp, "verify").then(resolve, function (e) {
              e.paymentId = resp.razorpay_payment_id;
              reject(e);
            });
          },
          modal: {
            ondismiss: function () {
              if (settled) return;
              settled = true;
              reject(withCode(new Error("Payment cancelled"), "dismissed"));
            }
          }
        });
        // Razorpay lets the user retry inside the same modal after a failure
        // (payment.failed carries the Payment entity's error_* fields), so a
        // failure is only final once they close it (ondismiss above).
        rzp.on("payment.failed", function (resp) {
          if (resp && resp.error) console.warn("Razorpay payment failed:", resp.error.code, resp.error.description, resp.error.reason);
        });
        rzp.open();
      });
    });
  }

  global.KPPayment = {
    config: CONFIG,
    price: function (product) { return CONFIG.prices[product]; },
    pay: pay
  };
})(window);
