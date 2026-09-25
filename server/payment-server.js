/* Kundli Planet - Razorpay payment server.
   Zero-dependency Node (18+) server that keeps the Razorpay KEY SECRET off the
   browser and verifies every payment before a paid download is unlocked.

   Flow (per Razorpay Orders + Payment entity docs):
     1. POST /api/payments/order   -> creates a Razorpay Order. The amount comes
        from PRICES below, never from the browser.
     2. Browser opens Checkout with that order_id.
     3. POST /api/payments/verify  -> checks razorpay_signature
        (HMAC-SHA256 of "order_id|payment_id" with the key secret), then fetches
        the Payment entity (GET /v1/payments/:id), captures it if it is only
        "authorized", and confirms status "captured", order_id, amount and
        currency all match the order.

   Run:   node server/payment-server.js   (Node 20.12+)
   Keys are read from server/.env (see server/.env.example). This file runs
   only on the server - never load it in the browser or copy KEY_SECRET into
   frontend files. */
"use strict";

const http = require("http");
const crypto = require("crypto");

// Razorpay Dashboard -> Account & Settings -> API Keys, read from server/.env.
try {
  process.loadEnvFile(require("path").join(__dirname, ".env"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) {
  console.error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (set them in server/.env).");
  process.exit(1);
}
const PORT = 8787;
// Site origins allowed to call this server.
const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5501", "http://localhost:5501",
  "https://kundliplanet.in", "https://www.kundliplanet.in"
];

// Prices in paise (smallest currency subunit), per product.
const PRICES = {
  kundliPdf: { amount: 24900, currency: "INR", label: "Kundli PDF Report" }
};

const RZP_API = "https://api.razorpay.com/v1";

async function razorpay(method, apiPath, body) {
  const res = await fetch(RZP_API + apiPath, {
    method,
    headers: {
      Authorization: "Basic " + Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64"),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.description) || "Razorpay request failed");
    err.status = res.status === 401 ? 502 : 400;
    err.code = (data.error && data.error.code) || "RAZORPAY_ERROR";
    throw err;
  }
  return data;
}

// Razorpay notes: max 15 keys, string values up to 256 chars.
function cleanNotes(notes) {
  const out = {};
  if (notes && typeof notes === "object") {
    for (const k of Object.keys(notes).slice(0, 14)) {
      out[String(k).slice(0, 40)] = String(notes[k] == null ? "" : notes[k]).slice(0, 256);
    }
  }
  return out;
}

async function createOrder(body) {
  const price = PRICES[body.product];
  if (!price) throw Object.assign(new Error("Unknown product"), { status: 400, code: "UNKNOWN_PRODUCT" });
  const order = await razorpay("POST", "/orders", {
    amount: price.amount,
    currency: price.currency,
    receipt: ("kp_" + body.product + "_" + Date.now()).slice(0, 40),
    notes: Object.assign(cleanNotes(body.notes), { product: body.product })
  });
  return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID, label: price.label };
}

function signatureValid(orderId, paymentId, signature) {
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(orderId + "|" + paymentId).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function verifyPayment(body) {
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const fail = (msg, code) => Object.assign(new Error(msg), { status: 400, code });

  if (!orderId || !paymentId || !body.razorpay_signature) throw fail("Missing payment details", "MISSING_FIELDS");
  if (!signatureValid(orderId, paymentId, body.razorpay_signature)) throw fail("Invalid payment signature", "BAD_SIGNATURE");

  const order = await razorpay("GET", "/orders/" + encodeURIComponent(orderId));
  let payment = await razorpay("GET", "/payments/" + encodeURIComponent(paymentId));

  if (payment.order_id !== orderId) throw fail("Payment does not belong to this order", "ORDER_MISMATCH");
  if (payment.amount !== order.amount || payment.currency !== order.currency) throw fail("Payment amount mismatch", "AMOUNT_MISMATCH");

  // Accounts without auto-capture leave the payment "authorized"; capture it now.
  if (payment.status === "authorized") {
    payment = await razorpay("POST", "/payments/" + encodeURIComponent(paymentId) + "/capture",
      { amount: payment.amount, currency: payment.currency });
  }
  if (payment.status !== "captured" || !payment.captured) {
    throw fail("Payment not completed (status: " + payment.status + ")", "NOT_CAPTURED");
  }

  console.log("[payment] verified", payment.id, payment.amount / 100, payment.currency,
    "contact:", payment.contact || "-", "email:", payment.email || "-");
  return {
    verified: true,
    paymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    // Customer details as entered in Razorpay Checkout (Payment entity).
    contact: payment.contact || null,
    email: payment.email || null,
    product: (order.notes && order.notes.product) || null
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(Object.assign(e, { status: 400, code: "BAD_JSON" })); } });
    req.on("error", reject);
  });
}

const ROUTES = {
  "POST /api/payments/order": createOrder,
  "POST /api/payments/verify": verifyPayment,
  "GET /api/health": async () => ({ ok: true, keyConfigured: Boolean(KEY_ID && KEY_SECRET), mode: KEY_ID.startsWith("rzp_live_") ? "live" : "test" })
};

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const send = (status, obj) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  const handler = ROUTES[req.method + " " + req.url.split("?")[0]];
  if (!handler) return send(404, { error: { code: "NOT_FOUND", description: "Not found" } });

  try {
    const body = req.method === "POST" ? await readJson(req) : {};
    send(200, await handler(body));
  } catch (e) {
    console.error("[payment]", req.url, e.code || "", e.message);
    send(e.status || 500, { error: { code: e.code || "SERVER_ERROR", description: e.message } });
  }
});

server.listen(PORT, () => console.log("Kundli Planet payment server on http://localhost:" + PORT + " (" + (KEY_ID.startsWith("rzp_live_") ? "LIVE" : "test") + " mode)"));
