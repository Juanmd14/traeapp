import Link from "next/link";
import Image from "next/image";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo-vadelivery.jpg"
              alt="Vadelivery"
              width={140}
              height={44}
              className="h-8 w-auto object-contain object-left"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-body-sm text-neutral-600 hover:text-neutral-900 font-medium transition"
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
      <footer className="border-t border-neutral-100 py-8 text-center text-body-sm text-neutral-400">
        © {new Date().getFullYear()} Vadelivery · Todos los derechos reservados
      </footer>
    </div>
  );
}
