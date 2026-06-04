// Uso: node scripts/set-password.mjs <email> <nueva_password>
// Setea la password de un usuario via admin API (service_role). Solo testing local.
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

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Uso: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

let target = null;
for (let page = 1; page <= 10 && !target; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("Error listando:", error.message); process.exit(1); }
  target = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 200) break;
}

if (!target) { console.error(`No existe usuario ${email}`); process.exit(1); }

const { error } = await supabase.auth.admin.updateUserById(target.id, {
  password,
  email_confirm: true,
});

if (error) { console.error("Error:", error.message); process.exit(1); }
console.log(`OK -> password actualizada para ${email}`);
