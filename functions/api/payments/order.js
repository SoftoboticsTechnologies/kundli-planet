/* POST /api/payments/order - creates a PayU transaction (txnid + request
   hash) for the Bolt checkout. Amount comes from PRICES in
   functions/_lib/payu.js, never from the browser; the salt never leaves the
   server. See payment.js (frontend) and functions/api/payments/verify.js. */
import { PRICES, requestHash, clean, boltSrc, payuMode, json, apiError, requireKeys } from "../../_lib/payu.js";

export async function onRequestPost({ request, env }) {
  try {
    requireKeys(env);
    const body = await request.json().catch(() => ({}));

    const price = PRICES[body.product];
    if (!price) throw apiError("Unknown product", 400, "UNKNOWN_PRODUCT");

    const c = body.customer || {};
    const email = String(c.email || "").trim().slice(0, 50);
    const phone = String(c.phone || "").replace(/\D/g, "").slice(-10);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw apiError("Please enter a valid email", 400, "BAD_EMAIL");
    if (phone.length !== 10) throw apiError("Please enter a valid 10-digit mobile number", 400, "BAD_PHONE");

    const notes = body.notes || {};
    const txn = {
      txnid: ("KP" + Date.now() + crypto.randomUUID().replace(/-/g, "")).slice(0, 25),
      amount: price.amount,
      productinfo: clean(price.label, 100),
      firstname: clean(c.name, 60) || "Customer",
      email,
      phone,
      // udf1 ties the payment to a product so verify.js can check the amount.
      udf1: body.product,
      udf2: clean(notes.birth_date, 60),
      udf3: clean(notes.birth_place, 60),
      udf4: "",
      udf5: ""
    };

    // Bolt reports the result to responseHandler in the page, but PayU still
    // requires surl/furl - point them back at the page the payment started on.
    const origin = new URL(request.url).origin;
    let returnUrl = origin + "/";
    try { if (new URL(body.returnUrl).origin === origin) returnUrl = body.returnUrl; } catch (e) { /* keep default */ }

    return json(200, Object.assign(txn, {
      key: env.PAYU_KEY,
      hash: requestHash(env, txn),
      surl: returnUrl,
      furl: returnUrl,
      currency: price.currency,
      label: price.label,
      mode: payuMode(env),
      boltSrc: boltSrc(env)
    }));
  } catch (e) {
    console.error("[payment] order", e.code || "", e.message);
    return json(e.status || 500, { error: { code: e.code || "SERVER_ERROR", description: e.message } });
  }
}
