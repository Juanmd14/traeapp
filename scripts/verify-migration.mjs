// Verifica que apply_payment_webhook (migración 0009) reutilice la fila
// pending en vez de duplicarla. Usa la orden 65 y limpia lo que agrega.
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

const ORDER = "5e505180-d49c-4953-86f3-ac755ed33fa6"; // orden 65
const TESTPAY = "TESTPAY999"; // id de pago ficticio para la prueba
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const count = async () => (await sb.from("payments").select("id", { count: "exact", head: true }).eq("order_id", ORDER)).count;

// 0) Limpieza inicial: borrar filas pendientes huérfanas (mp_payment_id null) y restos de pruebas previas.
await sb.from("payments").delete().eq("order_id", ORDER).is("mp_payment_id", null);
await sb.from("payments").delete().eq("order_id", ORDER).eq("mp_payment_id", TESTPAY);
console.log("filas tras limpieza inicial:", await count(), "(deberia ser 1: la approved real)");

// 1) Insertar una fila pending simulada (como la que crea una orden nueva).
await sb.from("payments").insert({ order_id: ORDER, method: "mercadopago", status: "pending", amount: 8500, currency: "ARS" });
const before = await count();
console.log("filas tras insertar pending simulada:", before, "(deberia ser 2)");

// 2) Llamar a la RPC con un pago nuevo -> deberia RECLAMAR la pending, no insertar.
const { error } = await sb.rpc("apply_payment_webhook", {
  p_order_id: ORDER,
  p_mp_payment_id: TESTPAY,
  p_status: "approved",
  p_status_detail: "test",
  p_amount: 8500,
  p_raw: { test: true },
});
if (error) { console.error("RPC error:", error.message); process.exit(1); }

const after = await count();
console.log("filas tras la RPC:", after);
console.log(after === before
  ? "✅ FIX OK: reutilizo la fila pending (no duplico). Migracion 0009 activa."
  : "❌ Aun duplica (" + before + " -> " + after + "). La 0009 NO esta aplicada.");

// 3) Cleanup: borrar la fila de prueba (TESTPAY) para dejar la orden 65 limpia.
await sb.from("payments").delete().eq("order_id", ORDER).eq("mp_payment_id", TESTPAY);
console.log("filas finales en orden 65:", await count(), "(1 = solo el pago approved real, limpio)");
