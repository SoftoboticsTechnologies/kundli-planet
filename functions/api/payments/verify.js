/* POST /api/payments/verify - takes the PayU response that Bolt handed to
   the page, checks its reverse hash (SHA-512 with the salt), then confirms
   the transaction with PayU's verify_payment API: status "success", and the
   amount matches PRICES for the product in udf1. See
   functions/api/payments/order.js and payment.js (frontend). */
import { PRICES, responseHashValid, verifyPayment, json, apiError, requireKeys } from "../../_lib/payu.js";

export async function onRequestPost({ request, env }) {
  try {
    requireKeys(env);
    const body = await request.json().catch(() => ({}));

    const txnid = body.txnid;
    if (!txnid || !body.hash || !body.mihpayid) throw apiError("Missing payment details", 400, "MISSING_FIELDS");
    if (!responseHashValid(env, body)) throw apiError("Invalid payment hash", 400, "BAD_SIGNATURE");

    // Don't trust the browser-side response alone - ask PayU directly.
    const t = await verifyPayment(env, String(txnid));
    if (!t || t.status !== "success") {
      throw apiError("Payment not completed (status: " + ((t && t.status) || "unknown") + ")", 400, "NOT_CAPTURED");
    }

    const price = PRICES[t.udf1];
    if (!price) throw apiError("Unknown product on payment", 400, "UNKNOWN_PRODUCT");
    const paid = Number(t.transaction_amount || t.amt);
    if (!(paid >= Number(price.amount))) throw apiError("Payment amount mismatch", 400, "AMOUNT_MISMATCH");

    console.log("[payment] verified", t.mihpayid, paid, price.currency, "txnid:", txnid,
      "phone:", t.phone || "-", "email:", t.email || body.email || "-");

    return json(200, {
      verified: true,
      paymentId: String(t.mihpayid),
      orderId: String(txnid),
      amount: paid,
      currency: price.currency,
      method: t.mode || null,
      status: t.status,
      contact: t.phone || body.phone || null,
      email: t.email || body.email || null,
      product: t.udf1
    });
  } catch (e) {
    console.error("[payment] verify", e.code || "", e.message);
    return json(e.status || 500, { error: { code: e.code || "SERVER_ERROR", description: e.message } });
  }
}
