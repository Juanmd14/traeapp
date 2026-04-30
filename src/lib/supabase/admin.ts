/**
 * Supabase admin client con service_role.
 *
 * ⚠️  NUNCA importar este archivo en código que vaya al cliente.
 *     Sólo en Server Actions, Route Handlers, Edge Functions y crons.
 *
 * Salta RLS — usar para webhooks, jobs internos y operaciones que requieran
 * privilegios elevados.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
