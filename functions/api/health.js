/* GET /api/health - reports whether Razorpay keys are configured. */
import { json } from "../_lib/razorpay.js";

export async function onRequestGet({ env }) {
  const keyConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  return json(200, {
    ok: true,
    keyConfigured,
    mode: keyConfigured && env.RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "live" : "test"
  });
}
