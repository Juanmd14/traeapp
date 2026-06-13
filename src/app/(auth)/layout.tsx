import Link from "next/link";
import { Bike } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 dark:bg-neutral-950">
      {/* Panel lateral — solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 text-white p-12 flex-col justify-between">
        <Link href="/" className="inline-block w-fit">
          <Logo forceWhite className="h-10 w-auto" priority />
        </Link>

        <div className="space-y-4 max-w-md">
          <p className="text-display-md font-bold leading-tight">
            Pedí lo que quieras, llega rápido.
          </p>
          <p className="text-body-lg opacity-90">
            El delivery de tu ciudad. Comercios locales, repartidores propios.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-body-sm transition-colors group"
          >
            <Bike className="size-4 group-hover:translate-x-0.5 transition-transform" />
            ¿Querés ser repartidor? Sumate →
          </Link>
        </div>

        <p className="text-body-sm opacity-70">
          © {new Date().getFullYear()} Trae
        </p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 dark:bg-neutral-950">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <Logo className="h-12 w-auto" priority />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}