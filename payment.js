/* Kundli Planet - PayU payment wrapper for paid downloads.
   Plain global-scope script (no bundler on this site - see support.js).
   Exposes window.KPPayment.

   Uses PayU Bolt (checkout popup, customer stays on this page) with
   server-side hashing and verification
   (functions/api/payments/ - Cloudflare Pages Functions):
     1. ask for email + mobile (PayU requires them)
     2. server creates the txnid and request hash (amount is set on the
        server, not here)
     3. Bolt opens with that transaction
     4. server checks the response hash and asks PayU (verify_payment) that
        the status is "success" for the right amount before we resolve.
   No PayU salt lives in this file - the server returns the public merchant
   key and the Bolt script URL (test or live) along with the transaction. */
(function (global) {
  "use strict";

  var CONFIG = {
    // Payment API is served by Cloudflare Pages Functions under /api on the
    // same origin as this site (see functions/api/payments/). Run
    // `wrangler pages dev .` locally so /api works there too.
    apiBase: "",
    themeColor: "#C79A20",
    // Display prices in rupees (button label only). The amount actually
    // charged comes from PRICES in functions/_lib/payu.js - keep in sync.
    prices: {
      kundliPdf: 249
    }
  };

  var LABELS = {
    en: { title: "Your contact details", note: "PayU sends the payment receipt here.", email: "Email",
      phone: "Mobile number", pay: "Continue to pay", cancel: "Cancel",
      badEmail: "Please enter a valid email.", badPhone: "Please enter a valid 10-digit mobile number." },
    hi: { title: "आपकी संपर्क जानकारी", note: "PayU भुगतान की रसीद यहाँ भेजेगा।", email: "ईमेल",
      phone: "मोबाइल नंबर", pay: "भुगतान जारी रखें", cancel: "रद्द करें",
      badEmail: "कृपया सही ईमेल दर्ज करें।", badPhone: "कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।" }
  };
  var CONTACT_KEY = "kp.payContact.v1";

  var boltPromise = null;

  function loadBolt(src) {
    if (global.bolt) return Promise.resolve();
    if (boltPromise) return boltPromise;
    boltPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.id = "bolt";
      s.onload = function () { resolve(); };
      s.onerror = function () {
        boltPromise = null;
        s.remove();
        reject(new Error("Could not load PayU checkout"));
      };
      document.head.appendChild(s);
    });
    return boltPromise;
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

  function readContact() {
    try { return JSON.parse(localStorage.getItem(CONTACT_KEY) || "null") || {}; } catch (e) { return {}; }
  }
  function saveContact(c) {
    try { localStorage.setItem(CONTACT_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
  }

  // Small self-contained popup asking for email + mobile.
  // Resolves { email, phone }; rejects with code "dismissed" on cancel.
  function askContact(lang, prefill) {
    var L = LABELS[lang] || LABELS.en;
    var saved = readContact();
    return new Promise(function (resolve, reject) {
      var wrap = document.createElement("div");
      wrap.setAttribute("role", "dialog");
      wrap.setAttribute("aria-modal", "true");
      wrap.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(20,14,4,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit";
      var input = "width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #D9CBA6;border-radius:10px;font-size:15px;margin:6px 0 12px;font-family:inherit";
      wrap.innerHTML =
        '<form novalidate style="background:#fff;color:#2A2113;width:100%;max-width:380px;border-radius:16px;padding:22px 20px;box-shadow:0 18px 50px rgba(0,0,0,.25)">' +
        '<h3 style="margin:0 0 4px;font-size:19px"></h3><p data-k="note" style="margin:0 0 14px;font-size:13px;color:#6B5E45"></p>' +
        '<label style="font-size:13px;font-weight:600"><span data-k="email"></span><input name="email" type="email" autocomplete="email" inputmode="email" style="' + input + '"></label>' +
        '<label style="font-size:13px;font-weight:600"><span data-k="phone"></span><input name="phone" type="tel" autocomplete="tel" inputmode="numeric" maxlength="14" style="' + input + '"></label>' +
        '<p data-k="err" style="display:none;margin:0 0 12px;font-size:13px;color:#8A2A24"></p>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button type="button" data-k="cancel" style="padding:10px 16px;border-radius:10px;border:1px solid #D9CBA6;background:#fff;font-size:14px;cursor:pointer;font-family:inherit"></button>' +
        '<button type="submit" data-k="pay" style="padding:10px 16px;border-radius:10px;border:0;background:' + CONFIG.themeColor + ';color:#fff;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit"></button>' +
        "</div></form>";
      var form = wrap.querySelector("form");
      var q = function (k) { return wrap.querySelector('[data-k="' + k + '"]'); };
      wrap.querySelector("h3").textContent = L.title;
      q("note").textContent = L.note;
      q("email").textContent = L.email;
      q("phone").textContent = L.phone;
      q("cancel").textContent = L.cancel;
      q("pay").textContent = L.pay;
      form.email.value = (prefill && prefill.email) || saved.email || "";
      form.phone.value = (prefill && prefill.contact) || saved.phone || "";

      function close() { document.removeEventListener("keydown", onKey); wrap.remove(); }
      function cancel() { close(); reject(withCode(new Error("Payment cancelled"), "dismissed")); }
      function onKey(e) { if (e.key === "Escape") cancel(); }

      q("cancel").addEventListener("click", cancel);
      wrap.addEventListener("click", function (e) { if (e.target === wrap) cancel(); });
      document.addEventListener("keydown", onKey);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = form.email.value.trim();
        var phone = form.phone.value.replace(/\D/g, "").slice(-10);
        var err = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? L.badEmail : phone.length !== 10 ? L.badPhone : "";
        if (err) { q("err").textContent = err; q("err").style.display = "block"; return; }
        saveContact({ email: email, phone: phone });
        close();
        resolve({ email: email, phone: phone });
      });
      document.body.appendChild(wrap);
      (form.email.value ? form.phone : form.email).focus();
    });
  }

  // Runs the full paid flow for a product.
  // opts: { description, notes, prefill: { name, email, contact }, lang: "en" | "hi" }
  // Resolves with the verified payment { paymentId, orderId, amount, currency, method, status }.
  // Rejects with an Error whose .code is:
  //   "load"      checkout script or payment server unreachable
  //   "server"    server could not create the transaction (e.g. bad API keys)
  //   "dismissed" user closed checkout without paying
  //   "failed"    PayU reported the payment as failed
  //   "verify"    payment made but could not be verified (.paymentId is set)
  function pay(product, opts) {
    opts = opts || {};
    var prefill = opts.prefill || {};
    var notes = opts.notes || {};
    return askContact(opts.lang, prefill).then(function (contact) {
      return api("/api/payments/order", {
        product: product,
        notes: notes,
        returnUrl: global.location.href.split("#")[0],
        customer: { name: prefill.name || notes.name || "", email: contact.email, phone: contact.phone }
      }, "server");
    }).then(function (txn) {
      return loadBolt(txn.boltSrc).catch(function (e) { throw withCode(e, "load"); }).then(function () { return txn; });
    }).then(function (txn) {
      return new Promise(function (resolve, reject) {
        var settled = false;
        function done(fn, v) { if (settled) return; settled = true; fn(v); }
        global.bolt.launch({
          key: txn.key,
          txnid: txn.txnid,
          hash: txn.hash,
          amount: txn.amount,
          firstname: txn.firstname,
          email: txn.email,
          phone: txn.phone,
          productinfo: txn.productinfo,
          udf1: txn.udf1, udf2: txn.udf2, udf3: txn.udf3, udf4: txn.udf4, udf5: txn.udf5,
          surl: txn.surl,
          furl: txn.furl
        }, {
          responseHandler: function (BOLT) {
            var r = (BOLT && BOLT.response) || {};
            if (r.txnStatus === "CANCEL") return done(reject, withCode(new Error("Payment cancelled"), "dismissed"));
            if (r.txnStatus !== "SUCCESS") {
              console.warn("PayU payment failed:", r.txnStatus, r.error, r.error_Message || r.field9);
              return done(reject, withCode(new Error(r.error_Message || "Payment failed"), "failed"));
            }
            settled = true;
            api("/api/payments/verify", r, "verify").then(resolve, function (e) {
              e.paymentId = r.mihpayid || r.txnid;
              reject(e);
            });
          },
          catchException: function (BOLT) {
            console.error("PayU checkout error:", BOLT && BOLT.message);
            done(reject, withCode(new Error((BOLT && BOLT.message) || "PayU checkout error"), "server"));
          }
        });
      });
    });
  }

  global.KPPayment = {
    config: CONFIG,
    price: function (product) { return CONFIG.prices[product]; },
    pay: pay
  };
})(window);
