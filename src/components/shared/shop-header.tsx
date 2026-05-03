import Link from "next/link";
import Image from "next/image";
import { MapPin, User, Store, ClipboardList } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/shared/search-bar";

function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex items-center shrink-0 pr-4 mr-2 border-r border-neutral-200"
      aria-label="Vadelivery — inicio"
    >
      <Image
        src="/logo-vadelivery.jpg"
        alt="Vadelivery"
        width={400}
        height={128}
        className="h-16 w-auto max-w-[130px] object-contain object-left"
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

  let defaultAddressLine: string | null = null;

  if (session) {
    const supabase = await createClient();

    const { data } = await supabase
      .from("addresses")
      .select("label, street, number")
      .eq("profile_id", session.id)
      .eq("is_default", true)
      .maybeSingle();

    const addr = data as AddressData | null;

    if (addr) {
      defaultAddressLine = addr.label
        ? addr.label
        : `${addr.street ?? ""}${addr.number ? " " + addr.number : ""}`;
    }
  }

  const isStoreOwner =
    session?.role === "store_owner" ||
    session?.role === "store_staff" ||
    session?.role === "admin";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

        <div className="flex items-center h-16 gap-2 sm:gap-3">

          <BrandLogo />

          {/* Dirección — solo desktop */}
          {session && (
            <Link
              href="/direcciones"
              className="hidden lg:flex items-center gap-1.5 shrink-0 group"
            >
              <MapPin className="size-4 text-primary-600 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0 max-w-[150px]">
                <p className="text-[10px] text-neutral-400 leading-none uppercase tracking-wider">
                  Enviar a
                </p>
                <p className="text-body-sm font-semibold text-neutral-900 leading-tight truncate group-hover:text-primary-600 transition">
                  {defaultAddressLine ?? "Agregar dirección"}
                </p>
              </div>
            </Link>
          )}

          {session && (
            <div className="hidden lg:block w-px h-6 bg-neutral-200 shrink-0" />
          )}

          {/* Buscador */}
          <div className="flex-1 flex justify-center min-w-0">
            <div className="w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          {/* Acciones derecha */}
          {session ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/pedidos"
                className="hidden md:inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-2 rounded-lg transition"
              >
                <ClipboardList className="size-4" />
                <span className="hidden lg:inline">Mis pedidos</span>
              </Link>

              {/* Mi comercio — solo ícono en mobile */}
              {isStoreOwner && (
                <Link
                  href="/comercio/pedidos"
                  className="inline-flex items-center justify-center sm:gap-1.5 size-9 sm:size-auto sm:px-3 sm:py-2 text-body-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition shadow-sm"
                  aria-label="Mi comercio"
                >
                  <Store className="size-4" />
                  <span className="hidden md:inline">Mi comercio</span>
                </Link>
              )}

              <Link
                href="/perfil"
                className="group flex items-center gap-2 pl-1 sm:pl-2 pr-1 py-1 rounded-lg hover:bg-neutral-100 transition"
              >
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] text-neutral-500 leading-tight">Hola</p>
                  <p className="text-body-sm font-semibold text-neutral-900 leading-tight group-hover:text-primary-600 transition">
                    {session.fullName.split(" ")[0]}
                  </p>
                </div>
                <div className="size-8 rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-body-sm relative ring-2 ring-primary-400 ring-offset-1 ring-offset-white group-hover:ring-primary-600 transition">
                  {session.avatarUrl ? (
                    <Image src={session.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
                  ) : (
                    <span>{session.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link
              href="/login?next=/"
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 sm:px-4 py-2 rounded-lg transition shadow-sm shrink-0"
            >
              <User className="size-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}
        </div>

        {/* Fila mobile — dirección debajo */}
        {session && (
          <div className="lg:hidden flex items-center justify-between pb-2 gap-2">
            <Link href="/direcciones" className="flex items-center gap-1.5 min-w-0 group">
              <MapPin className="size-3.5 text-primary-600 shrink-0" strokeWidth={2.5} />
              <span className="text-body-sm font-medium text-neutral-700 group-hover:text-primary-600 transition truncate">
                {defaultAddressLine ?? "Agregar dirección"}
              </span>
            </Link>
            <Link
              href="/pedidos"
              className="md:hidden size-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition shrink-0"
              aria-label="Mis pedidos"
            >
              <ClipboardList className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}