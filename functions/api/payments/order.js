/* POST /api/payments/order - creates a Razorpay Order. Amount comes from
   PRICES in functions/_lib/razorpay.js, never from the browser.
   See payment.js (frontend) and functions/api/payments/verify.js. */
import { PRICES, razorpay, cleanNotes, json, apiError, requireKeys } from "../../_lib/razorpay.js";

export async function onRequestPost({ request, env }) {
  try {
    requireKeys(env);
    const body = await request.json().catch(() => ({}));

    const price = PRICES[body.product];
    if (!price) throw apiError("Unknown product", 400, "UNKNOWN_PRODUCT");

    const order = await razorpay(env, "POST", "/orders", {
      amount: price.amount,
      currency: price.currency,
      receipt: ("kp_" + body.product + "_" + Date.now()).slice(0, 40),
      notes: Object.assign(cleanNotes(body.notes), { product: body.product })
    });

    return json(200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      label: price.label
    });
  } catch (e) {
    console.error("[payment] order", e.code || "", e.message);
    return json(e.status || 500, { error: { code: e.code || "SERVER_ERROR", description: e.message } });
  }
}
