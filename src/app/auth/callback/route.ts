import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de Supabase Auth para magic links y OAuth.
 * Recibe el `code` en el query string e intercambia por una sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchange error:", error);
  }

  // Si algo falla, mandamos al login con un mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
