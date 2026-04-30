import Link from "next/link";
import Image from "next/image";
import { MapPin, Search, User } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function ShopHeader() {
  const session = await getSession();

  // Si el usuario tiene una dirección default, la mostramos arriba
  let defaultAddressLine: string | null = null;
  if (session) {
    const supabase = createClient();
    const { data: addr } = await supabase
      .from("addresses")
      .select("label, street, number")
      .eq("profile_id", session.id)
      .eq("is_default", true)
      .maybeSingle();
    if (addr) {
      defaultAddressLine = addr.label
        ? addr.label
        : `${addr.street}${addr.number ? " " + addr.number : ""}`;
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200">
      <div className="container-shop py-3">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={session ? "/direcciones" : "/login?next=/"}
            className="flex items-center gap-1.5 text-left flex-1 min-w-0"
          >
            <MapPin className="size-4 text-primary-600 shrink-0" strokeWidth={2.5} />
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-500 leading-none">
                {session ? "Enviar a" : "Ingresá para pedir"}
              </p>
              <p className="text-body-md font-medium text-neutral-900 leading-tight truncate">
                {defaultAddressLine ?? (session ? "Agregar dirección" : "¿A dónde?")}
              </p>
            </div>
          </Link>

          {session ? (
            <Link
              href="/perfil"
              className="size-9 rounded-full overflow-hidden bg-primary-600 text-white flex items-center justify-center font-medium text-body-md shrink-0 ml-2 relative"
              aria-label="Mi perfil"
            >
              {session.avatarUrl ? (
                <Image
                  src={session.avatarUrl}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span>{session.fullName.charAt(0).toUpperCase()}</span>
              )}
            </Link>
          ) : (
            <Link
              href="/login?next=/"
              className="text-body-sm font-medium text-primary-600 hover:text-primary-700 ml-2 shrink-0 inline-flex items-center gap-1"
            >
              <User className="size-4" />
              Ingresar
            </Link>
          )}
        </div>

        <button
          className="w-full flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200/70 transition rounded-md px-3 py-2.5"
          aria-label="Buscar"
        >
          <Search className="size-4 text-neutral-400" />
          <span className="text-body-md text-neutral-400">
            Buscar comercios o productos
          </span>
        </button>
      </div>
    </header>
  );
}
