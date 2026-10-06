/* Kundli Planet - PayU helpers shared by the Pages Functions under
   functions/api/payments/.
   requires compatibility_flags = ["nodejs_compat"] in wrangler.toml so
   Node's crypto module (SHA-512) works unchanged on Workers.
   Hash formulas: https://docs.payu.in/reference/_payment_payu_hosted_checkout */
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

// PAYU_MODE=live switches to production; anything else is the test sandbox.
const HOSTS = {
  test: { verify: "https://test.payu.in/merchant/postservice.php?form=2", bolt: "https://jssdk-uat.payu.in/bolt/bolt.min.js" },
  live: { verify: "https://info.payu.in/merchant/postservice.php?form=2", bolt: "https://jssdk.payu.in/bolt/bolt.min.js" }
};

export function payuMode(env) {
  return env.PAYU_MODE === "live" ? "live" : "test";
}

export function boltSrc(env) {
  return HOSTS[payuMode(env)].bolt;
}

// Prices in rupees as PayU expects them ("249.00"), per product. Amount is
// always taken from here, never from the browser.
export const PRICES = {
  kundliPdf: { amount: "249.00", currency: "INR", label: "Kundli PDF Report" }
};

export function apiError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

function sha512(s) {
  return crypto.createHash("sha512").update(s).digest("hex");
}

// PayU rejects/mangles some characters in these fields, and "|" would break
// the hash string - keep them to a safe ASCII subset.
export function clean(value, max) {
  return String(value == null ? "" : value).replace(/[^A-Za-z0-9 .,@_\-\/:]/g, "").trim().slice(0, max);
}

// sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
export function requestHash(env, p) {
  return sha512([env.PAYU_KEY, p.txnid, p.amount, p.productinfo, p.firstname, p.email,
    p.udf1, p.udf2, p.udf3, p.udf4, p.udf5, "", "", "", "", "", env.PAYU_SALT].join("|"));
}

// Reverse hash on the response:
// sha512([additionalCharges|]SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
export function responseHashValid(env, r) {
  const parts = [env.PAYU_SALT, r.status, "", "", "", "", "", r.udf5, r.udf4, r.udf3, r.udf2, r.udf1,
    r.email, r.firstname, r.productinfo, r.amount, r.txnid, env.PAYU_KEY].map(v => (v == null ? "" : String(v)));
  if (r.additionalCharges) parts.unshift(String(r.additionalCharges));
  const a = Buffer.from(sha512(parts.join("|")));
  const b = Buffer.from(String(r.hash || "").toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Server-to-server status check (command verify_payment). Returns the
// transaction_details entry for txnid, or null if PayU does not know it.
export async function verifyPayment(env, txnid) {
  const command = "verify_payment";
  const form = new URLSearchParams({
    key: env.PAYU_KEY,
    command,
    var1: txnid,
    hash: sha512([env.PAYU_KEY, command, txnid, env.PAYU_SALT].join("|"))
  });
  const res = await fetch(HOSTS[payuMode(env)].verify, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw apiError("PayU verify request failed", 502, "PAYU_ERROR");
  return (data.transaction_details && data.transaction_details[txnid]) || null;
}

export function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

export function requireKeys(env) {
  if (!env.PAYU_KEY || !env.PAYU_SALT) {
    throw apiError("Payment gateway not configured", 500, "MISSING_KEYS");
  }
}
