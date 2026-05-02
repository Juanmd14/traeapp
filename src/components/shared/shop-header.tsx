import Link from "next/link";
import Image from "next/image";

import {
  MapPin,
  Search,
  User,
  Store,
} from "lucide-react";

import { getSession } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Marca en el header */
function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex items-center shrink-0 py-0.5 pr-2 sm:pr-3 mr-1 border-r border-neutral-200"
      aria-label="Vadelivery — inicio"
    >
      <Image
        src="/logo-vadelivery.png"
        alt="Vadelivery"
        width={152}
        height={48}
        className="h-8 w-auto max-w-[120px] sm:h-9 sm:max-w-[140px] object-contain object-left"
        priority
      />
    </Link>
  );
}

type AddressData = {
  label: string | null;
  street: string | null;
  number: string | null;
};

export async function ShopHeader() {
  const session = await getSession();

  let defaultAddressLine: string | null =
    null;

  if (session) {
    const supabase = await createClient();

    const { data } = await supabase
      .from("addresses")
      .select(`
        label,
        street,
        number
      `)
      .eq("profile_id", session.id)
      .eq("is_default", true)
      .maybeSingle();

    const addr =
      data as AddressData | null;

    if (addr) {
      defaultAddressLine = addr.label
        ? addr.label
        : `${addr.street ?? ""}${
            addr.number
              ? " " + addr.number
              : ""
          }`;
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200">
      <div className="container-shop py-3">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 min-h-[44px]">
          <BrandLogo />

          <Link
            href={
              session
                ? "/direcciones"
                : "/login?next=/"
            }
            className="flex items-center gap-1.5 text-left flex-1 min-w-0"
          >
            <MapPin
              className="size-4 text-primary-600 shrink-0"
              strokeWidth={2.5}
            />

            <div className="min-w-0">
              <p className="text-[11px] text-neutral-500 leading-none">
                {session
                  ? "Enviar a"
                  : "Ingresá para pedir"}
              </p>

              <p className="text-body-md font-medium text-neutral-900 leading-tight truncate">
                {defaultAddressLine ??
                  (session
                    ? "Agregar dirección"
                    : "¿A dónde?")}
              </p>
            </div>
          </Link>

          {session ? (
            <div className="flex items-center gap-2 shrink-0">
              {(session.role ===
                "store_owner" ||
                session.role ===
                  "store_staff" ||
                session.role ===
                  "admin") && (
                <Link
                  href="/comercio/pedidos"
                  className="inline-flex items-center gap-1.5 text-body-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition rounded-full size-9 sm:size-auto sm:px-3 sm:py-1.5 justify-center"
                  aria-label="Mi comercio"
                >
                  <Store className="size-4" />

                  <span className="hidden sm:inline">
                    Mi comercio
                  </span>
                </Link>
              )}

              <Link
                href="/perfil"
                className="group flex items-center gap-2.5 px-2 py-1 rounded-full hover:bg-neutral-100 transition"
                aria-label="Mi perfil"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] text-neutral-500 leading-tight">
                    Hola
                  </p>

                  <p className="text-body-sm font-medium text-neutral-900 leading-tight group-hover:text-primary-700 transition">
                    {
                      session.fullName.split(
                        " "
                      )[0]
                    }
                  </p>
                </div>

                <div className="size-9 rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-body-md relative ring-2 ring-primary-500 ring-offset-2 ring-offset-white group-hover:ring-primary-600 transition">
                  {session.avatarUrl ? (
                    <Image
                      src={session.avatarUrl}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span>
                      {session.fullName
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link
              href="/login?next=/"
              className="text-body-sm font-medium text-primary-600 hover:text-primary-700 shrink-0 inline-flex items-center gap-1"
            >
              <User className="size-4" />
              Ingresar
            </Link>
          )}
        </div>

        <button
          type="button"
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