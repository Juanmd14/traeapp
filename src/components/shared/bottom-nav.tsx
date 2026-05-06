"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLogged: boolean;
  role?: string | null;
};

const baseItems = [
  { href: "/", label: "Inicio", icon: Home, exact: true },
  { href: "/buscar", label: "Buscar", icon: Search },
];

export function BottomNav({ isLogged, role }: Props) {
  const pathname = usePathname();

  const isDriver = role === "delivery_driver" || role === "admin";

  const items = [
    ...baseItems,
    {
      href: isLogged ? "/pedidos" : "/login?next=/pedidos",
      label: "Pedidos",
      icon: ClipboardList,
      activeMatch: "/pedidos",
    },
    ...(isDriver
      ? [{ href: "/driver/disponibles", label: "Repartidor", icon: Bike, activeMatch: "/driver" }]
      : []),
    {
      href: isLogged ? "/perfil" : "/login",
      label: "Perfil",
      icon: User,
      activeMatch: "/perfil",
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 sm:hidden">
      <div className="container-shop">
        <div className="flex justify-between py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const matchPath = (item as any).activeMatch ?? item.href;
            const isActive = (item as any).exact
              ? pathname === item.href
              : pathname.startsWith(matchPath);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-md transition",
                  isActive
                    ? "text-primary-600"
                    : "text-neutral-400 hover:text-neutral-600",
                )}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[11px]", isActive && "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}