import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Package,
  Tag,
  Clock,
  BarChart3,
  LogOut,
  Building2,
} from "lucide-react";
import { requireAuth, getUserStores } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";

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

  // El usuario debe ser miembro de algún comercio (o admin)
  if (session.role !== "admin") {
    const stores = await getUserStores(session.id);
    if (stores.length === 0) {
      // No tiene comercio aún → onboarding
      redirect("/comercio/onboarding");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-neutral-200 flex-col">
        <div className="p-5 border-b border-neutral-200">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-vadelivery.png"
              alt="Vadelivery"
              width={140}
              height={44}
              className="h-8 w-auto max-w-[120px] object-contain object-left"
            />
          </Link>
          <p className="text-body-xs text-neutral-500 mt-1.5">Panel comercio</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-body-md text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-body-sm font-medium text-neutral-900 truncate">
              {session.fullName}
            </p>
            <p className="text-body-xs text-neutral-500 truncate">{session.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-body-md text-neutral-600 hover:bg-neutral-100 hover:text-destructive transition"
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
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link href="/" className="flex items-center min-w-0">
            <Image
              src="/logo-vadelivery.png"
              alt="Vadelivery"
              width={120}
              height={40}
              className="h-7 w-auto max-w-[108px] object-contain object-left"
            />
          </Link>
        </header>

        <div className="flex-1 p-4 lg:p-8">{children}</div>

        {/* Bottom nav móvil */}
        <nav className="lg:hidden bg-white border-t border-neutral-200 sticky bottom-0">
          <div className="flex justify-around py-2">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-neutral-500"
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
