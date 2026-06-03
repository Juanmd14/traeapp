import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  ClipboardList,
  Package,
  Tag,
  Clock,
  BarChart3,
  LogOut,
  Building2,
  Home,
} from "lucide-react";
import { requireAuth, getUserStoresWithNames, getActiveStoreId } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";
import { setActiveStoreAction } from "@/server/actions/stores";
import { StoreSwitcher } from "@/components/store-admin/store-switcher";

const navItems = [
  { href: "/comercio/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/comercio/datos", label: "Mi comercio", icon: Building2 },
  { href: "/comercio/productos", label: "Productos", icon: Package },
  { href: "/comercio/promociones", label: "Promociones", icon: Tag },
  { href: "/comercio/horarios", label: "Horarios", icon: Clock },
  { href: "/comercio/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

export default async function ComercioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth("/login?next=/comercio");

  const stores = await getUserStoresWithNames(session.id);

  if (session.role !== "admin" && stores.length === 0) {
    redirect("/comercio/onboarding");
  }

  const activeStoreId = getActiveStoreId(stores) ?? "";
  const activeStore = stores.find((s) => s.storeId === activeStoreId);
  const multiStore = stores.length > 1;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col">
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="flex items-center gap-2" aria-label="Vadelivery — Inicio">
            <Logo className="h-8 w-auto max-w-[120px]" />
          </Link>
          <p className="text-body-xs text-neutral-500 dark:text-neutral-400 mt-1.5">Panel comercio</p>

          {multiStore ? (
            <StoreSwitcher
              stores={stores.map((s) => ({ storeId: s.storeId, name: s.name }))}
              activeStoreId={activeStoreId}
              switchAction={setActiveStoreAction}
            />
          ) : activeStore ? (
            <p className="mt-2 text-body-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {activeStore.name}
            </p>
          ) : null}

          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-body-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition"
          >
            <Home className="size-3.5" />
            Volver al inicio
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-body-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {session.fullName}
            </p>
            <p className="text-body-xs text-neutral-500 dark:text-neutral-400 truncate">{session.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-body-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-destructive transition"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar móvil */}
        <header className="lg:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link href="/" className="flex items-center min-w-0" aria-label="Vadelivery — Inicio">
            <Logo className="h-7 w-auto max-w-[108px]" />
          </Link>
          <div className="flex items-center gap-2">
            {multiStore && (
              <StoreSwitcher
                stores={stores.map((s) => ({ storeId: s.storeId, name: s.name }))}
                activeStoreId={activeStoreId}
                switchAction={setActiveStoreAction}
              />
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-body-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Volver al inicio"
            >
              <Home className="size-4" />
              Inicio
            </Link>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8">{children}</div>

        {/* Bottom nav móvil */}
        <nav className="lg:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 sticky bottom-0">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-neutral-500 dark:text-neutral-400"
                >
                  <Icon className="size-5" />
                  <span className="text-[11px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
