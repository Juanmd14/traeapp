import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, Navigation, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-vadelivery.jpg"
            alt="Vadelivery"
            width={120}
            height={40}
            className="h-7 w-auto object-contain object-left"
          />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600 hidden sm:block">{session.fullName}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="p-2 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="bg-white border-t border-neutral-200 fixed bottom-0 inset-x-0 z-30">
        <div className="flex justify-around py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-8 py-1.5 text-neutral-500 hover:text-primary transition"
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
