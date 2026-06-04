// Uso: node scripts/confirm-user.mjs <email>
// Confirma el email de un usuario via admin API (service_role). Solo para testing local.
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

const email = process.argv[2];
if (!email) {
  console.error("Falta el email. Uso: node scripts/confirm-user.mjs <email>");
  process.exit(1);
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Buscar el usuario por email (paginando por las dudas)
let target = null;
for (let page = 1; page <= 10 && !target; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("Error listando usuarios:", error.message); process.exit(1); }
  target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 200) break;
}

if (!target) {
  console.error(`No se encontró ningún usuario con email ${email}`);
  process.exit(1);
}

const { error: updErr } = await supabase.auth.admin.updateUserById(target.id, {
  email_confirm: true,
});

if (updErr) { console.error("Error confirmando:", updErr.message); process.exit(1); }

console.log(`OK -> ${email} confirmado (id: ${target.id}). Ya podés entrar con tu contraseña.`);
