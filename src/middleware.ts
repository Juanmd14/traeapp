import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PROTECTED_PREFIXES = {
  comercio: ["/comercio"],
  driver: ["/driver"],
  admin: ["/admin"],
  account: ["/perfil", "/pedidos", "/direcciones"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // Refresca sesión si está por expirar.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.comercio.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PREFIXES.driver.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PREFIXES.admin.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PREFIXES.account.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // Validación de rol: dejamos el chequeo fino en cada layout
  // (consultando profiles.role) para evitar tocar la BD en cada navegación.

  return response;
}

export const config = {
  matcher: [
    /*
     * Excluimos:
     * - rutas de Next (_next/static, _next/image, favicon)
     * - rutas de API (que validan auth por su cuenta)
     * - assets estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)",
  ],
};
