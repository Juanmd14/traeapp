import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-body-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 font-medium transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-primary text-white text-body-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-8 text-center text-body-sm text-neutral-400 dark:text-neutral-500 space-y-2">
        <p>© {new Date().getFullYear()} Vadelivery · Todos los derechos reservados</p>
        <p className="text-xs text-neutral-300 dark:text-neutral-600">
          Diseñado y desarrollado por{" "}
          <a
            href="https://juanmd14.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary-500 dark:hover:text-primary-400"
          >
            Juan García
          </a>
        </p>
      </footer>
    </div>
  );
}
