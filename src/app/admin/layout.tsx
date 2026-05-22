import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  ClipboardList,
  Bike,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import { requireRole } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";

const navItems = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/repartidores", label: "Repartidores", icon: Bike },
  { href: "/admin/comercios", label: "Comercios", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin");

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-neutral-200 flex-col">
        <div className="p-5 border-b border-neutral-200">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto max-w-[120px]" />
          </Link>
          <p className="text-body-xs text-neutral-500 mt-1.5 font-medium">Panel Admin</p>
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
            <Logo className="h-7 w-auto max-w-[108px]" />
          </Link>
          <span className="text-body-xs font-semibold text-primary uppercase tracking-wide">
            Admin
          </span>
        </header>

        <div className="flex-1 p-4 lg:p-8">{children}</div>

        {/* Bottom nav móvil */}
        <nav className="lg:hidden bg-white border-t border-neutral-200 sticky bottom-0">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
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
