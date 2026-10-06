/* GET /api/health - reports whether PayU keys are configured. */
import { json, payuMode } from "../_lib/payu.js";

export async function onRequestGet({ env }) {
  const keyConfigured = Boolean(env.PAYU_KEY && env.PAYU_SALT);
  return json(200, {
    ok: true,
    keyConfigured,
    mode: payuMode(env)
  });
}
