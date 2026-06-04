// Uso: node scripts/check-order.mjs <orderId>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const orderId = process.argv[2];
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: order } = await sb.from("orders")
  .select("id, order_number, status, payment_method, payment_status, total")
  .eq("id", orderId).single();
console.log("ORDER:", order);

const { data: pays, error } = await sb.from("payments")
  .select("*")
  .eq("order_id", orderId)
  .order("created_at", { ascending: true });
console.log(`PAYMENTS (${pays?.length ?? 0} filas):`, JSON.stringify(pays, null, 2));
if (error) console.log("error:", error.message);
