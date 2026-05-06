"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Store,
  Bike,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { DriverOnlineToggle } from "@/components/driver/driver-online-toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: string;
  };
  isStoreOwner: boolean;
  isDriver: boolean;
};

export function UserMenuDropdown({ user, isStoreOwner, isDriver }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 pl-1 sm:pl-2 pr-1 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <div className="hidden lg:block text-right">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">Hola</p>
          <p className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-primary-600 transition">
            {user.fullName.split(" ")[0]}
          </p>
        </div>
        <div className="relative size-8 rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-body-sm ring-2 ring-primary-400 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900 group-hover:ring-primary-600 transition">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <span>{user.fullName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-neutral-400 transition-transform hidden lg:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <User className="size-4 text-neutral-400" />
            Mi perfil
          </Link>

          {isDriver && (
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2">
                Repartidor
              </p>
              <div className="mb-2">
                <DriverOnlineToggle initialOnline={false} />
              </div>
              <Link
                href="/driver/disponibles"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 py-1.5 text-body-sm text-neutral-700 dark:text-neutral-200 hover:text-green-600 transition"
              >
                <Bike className="size-4" />
                Panel de repartidor
              </Link>
            </div>
          )}

          {isStoreOwner && (
            <>
              {isDriver && (
                <div className="border-t border-neutral-100 dark:border-neutral-800" />
              )}
              <div className="px-4 py-2">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                  Mi comercio
                </p>
                <Link
                  href="/comercio/pedidos"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-1.5 text-body-sm text-neutral-700 dark:text-neutral-200 hover:text-primary-600 transition"
                >
                  <Store className="size-4" />
                  Panel de comercio
                </Link>
              </div>
            </>
          )}

          <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-body-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}