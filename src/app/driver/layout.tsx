import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Home, Package, Navigation, LogOut } from "lucide-react";
import { requireAuth } from "@/server/auth/session";
import { logoutAction } from "@/server/actions/auth";

const navItems = [
  { href: "/driver/disponibles", label: "Disponibles", icon: Package },
  { href: "/driver/activo", label: "Activo", icon: Navigation },
];

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth("/login?next=/driver/disponibles");

  if (!["delivery_driver", "admin"].includes(session.role)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center"
            aria-label="Vadelivery — Inicio"
          >
            <Logo className="h-7 w-auto" />
          </Link>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-body-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2.5 py-1.5 rounded-md transition"
          >
            <Home className="size-4" />
            Inicio
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="sm:hidden p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
            aria-label="Volver al inicio"
            title="Inicio"
          >
            <Home className="size-4" />
          </Link>
          <span className="text-sm text-neutral-600 dark:text-neutral-300 hidden sm:block">{session.fullName}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 fixed bottom-0 inset-x-0 z-30">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-8 py-1.5 text-neutral-500 dark:text-neutral-400 hover:text-primary transition"
              >
                <Icon className="size-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
