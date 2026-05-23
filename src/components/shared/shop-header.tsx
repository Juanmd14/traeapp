import { MapPin, User, ClipboardList } from "lucide-react";
import Link from "next/link";
import { ElasticLogo } from "@/components/brand/elastic-logo";
import { getSession } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/shared/search-bar";
import { NotificationsBell, type Notification } from "@/components/shared/notifications-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenuDropdown } from "@/components/shared/user-menu-dropdown";

function BrandLogo() {
  return (
    <div className="flex items-center shrink-0 pr-4 mr-2 border-r border-neutral-200 dark:border-neutral-700">
      <ElasticLogo className="h-7 w-auto" />
    </div>
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
  let notifications: Notification[] = [];
  let unreadCount = 0;

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

    // Notificaciones (best-effort)
    const { data: notifData } = await supabase
      .from("notifications")
      .select("id, title, body, data, read_at, created_at")
      .eq("user_id", session.id)
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(15);

    notifications = (notifData ?? []) as Notification[];
    unreadCount = notifications.filter(n => !n.read_at).length;
  }

  const isStoreOwner =
    session?.role === "store_owner" ||
    session?.role === "store_staff" ||
    session?.role === "admin";

  const isDriver =
    session?.role === "delivery_driver" ||
    session?.role === "admin";

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
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
                <p className="text-[10px] text-neutral-400 dark:text-neutral-400 leading-none uppercase tracking-wider">
                  Enviar a
                </p>
                <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight truncate group-hover:text-primary-600 transition">
                  {defaultAddressLine ?? "Agregar dirección"}
                </p>
              </div>
            </Link>
          )}

          {session && (
            <div className="hidden lg:block w-px h-6 bg-neutral-200 dark:bg-neutral-700 shrink-0" />
          )}

          {/* Buscador — solo desktop. En mobile va en su propia fila debajo */}
          <div className="hidden md:flex flex-1 justify-center min-w-0">
            <div className="w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          {/* Spacer mobile para empujar acciones a la derecha */}
          <div className="md:hidden flex-1" />

          {/* Acciones derecha */}
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">

              <Link
                href="/pedidos"
                className="hidden md:inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-3 py-2 rounded-lg transition"
              >
                <ClipboardList className="size-4" />
                <span className="hidden lg:inline">Mis pedidos</span>
              </Link>

              <NotificationsBell
                notifications={notifications}
                unreadCount={unreadCount}
              />

              <UserMenuDropdown
                user={{
                  id: session.id,
                  fullName: session.fullName,
                  avatarUrl: session.avatarUrl,
                  role: session.role,
                }}
                isStoreOwner={isStoreOwner}
                isDriver={isDriver}
              />
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

        {/* Fila mobile — buscador full width */}
        <div className="md:hidden pb-2">
          <SearchBar />
        </div>

        {/* Fila mobile — dirección debajo */}
        {session && (
          <div className="lg:hidden flex items-center justify-between pb-2 gap-2">
            <Link href="/direcciones" className="flex items-center gap-1.5 min-w-0 group">
              <MapPin className="size-3.5 text-primary-600 shrink-0" strokeWidth={2.5} />
              <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 transition truncate">
                {defaultAddressLine ?? "Agregar dirección"}
              </span>
            </Link>
            <Link
              href="/pedidos"
              className="md:hidden size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition shrink-0"
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