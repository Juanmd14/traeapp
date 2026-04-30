import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50">
      {/* Panel lateral (sólo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 text-white p-12 flex-col justify-between">
        <Link href="/" className="text-heading-lg font-bold">
          DeliveryLocal
        </Link>
        <div className="space-y-4 max-w-md">
          <p className="text-display-md font-bold leading-tight">
            Pedí lo que quieras, llega rápido.
          </p>
          <p className="text-body-lg opacity-90">
            El delivery de tu ciudad. Comercios locales, repartidores propios.
          </p>
        </div>
        <p className="text-body-sm opacity-70">
          © {new Date().getFullYear()} DeliveryLocal
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <Link
            href="/"
            className="lg:hidden block text-heading-lg font-bold text-primary-600 mb-8 text-center"
          >
            DeliveryLocal
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
