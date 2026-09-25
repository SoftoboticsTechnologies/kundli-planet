/* Kundli Planet - Razorpay helpers shared by the Pages Functions under
   functions/api/payments/. Ported from server/payment-server.js.
   requires compatibility_flags = ["nodejs_compat"] in wrangler.toml so
   Node's crypto module (HMAC) works unchanged on Workers. */
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

const RZP_API = "https://api.razorpay.com/v1";

// Prices in paise (smallest currency subunit), per product. Amount is always
// taken from here, never from the browser.
export const PRICES = {
  kundliPdf: { amount: 24900, currency: "INR", label: "Kundli PDF Report" }
};

export function apiError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

export async function razorpay(env, method, apiPath, body) {
  const auth = "Basic " + btoa(env.RAZORPAY_KEY_ID + ":" + env.RAZORPAY_KEY_SECRET);
  const res = await fetch(RZP_API + apiPath, {
    method,
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw apiError(
      (data.error && data.error.description) || "Razorpay request failed",
      res.status === 401 ? 502 : 400,
      (data.error && data.error.code) || "RAZORPAY_ERROR"
    );
  }
  return data;
}

// Razorpay notes: max 15 keys, string values up to 256 chars.
export function cleanNotes(notes) {
  const out = {};
  if (notes && typeof notes === "object") {
    for (const k of Object.keys(notes).slice(0, 14)) {
      out[String(k).slice(0, 40)] = String(notes[k] == null ? "" : notes[k]).slice(0, 256);
    }
  }
  return out;
}

export function signatureValid(env, orderId, paymentId, signature) {
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(orderId + "|" + paymentId).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

export function requireKeys(env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw apiError("Payment gateway not configured", 500, "MISSING_KEYS");
  }
}
