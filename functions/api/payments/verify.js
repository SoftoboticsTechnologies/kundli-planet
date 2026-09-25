/* POST /api/payments/verify - checks razorpay_signature (HMAC-SHA256 of
   "order_id|payment_id" with the key secret), then fetches the Payment
   entity, captures it if only "authorized", and confirms status "captured",
   order_id, amount and currency all match the order. See
   functions/api/payments/order.js and payment.js (frontend). */
import { razorpay, signatureValid, json, apiError, requireKeys } from "../../_lib/razorpay.js";

export async function onRequestPost({ request, env }) {
  try {
    requireKeys(env);
    const body = await request.json().catch(() => ({}));

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    if (!orderId || !paymentId || !body.razorpay_signature) throw apiError("Missing payment details", 400, "MISSING_FIELDS");
    if (!signatureValid(env, orderId, paymentId, body.razorpay_signature)) throw apiError("Invalid payment signature", 400, "BAD_SIGNATURE");

    const order = await razorpay(env, "GET", "/orders/" + encodeURIComponent(orderId));
    let payment = await razorpay(env, "GET", "/payments/" + encodeURIComponent(paymentId));

    if (payment.order_id !== orderId) throw apiError("Payment does not belong to this order", 400, "ORDER_MISMATCH");
    if (payment.amount !== order.amount || payment.currency !== order.currency) throw apiError("Payment amount mismatch", 400, "AMOUNT_MISMATCH");

    // Accounts without auto-capture leave the payment "authorized"; capture it now.
    if (payment.status === "authorized") {
      payment = await razorpay(env, "POST", "/payments/" + encodeURIComponent(paymentId) + "/capture",
        { amount: payment.amount, currency: payment.currency });
    }
    if (payment.status !== "captured" || !payment.captured) {
      throw apiError("Payment not completed (status: " + payment.status + ")", 400, "NOT_CAPTURED");
    }

    console.log("[payment] verified", payment.id, payment.amount / 100, payment.currency,
      "contact:", payment.contact || "-", "email:", payment.email || "-");

    return json(200, {
      verified: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      contact: payment.contact || null,
      email: payment.email || null,
      product: (order.notes && order.notes.product) || null
    });
  } catch (e) {
    console.error("[payment] verify", e.code || "", e.message);
    return json(e.status || 500, { error: { code: e.code || "SERVER_ERROR", description: e.message } });
  }
}
