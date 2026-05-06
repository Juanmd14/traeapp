import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50 dark:bg-neutral-950">
      {/* Panel lateral — solo desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 text-white p-12 flex-col justify-between">
        <Link
          href="/"
          className="inline-block w-fit rounded-lg bg-white px-3 py-2 shadow-sm"
        >
          <Image
            src="/logo-vadelivery.jpg"
            alt="Vadelivery"
            width={180}
            height={56}
            className="h-9 w-auto object-contain object-left"
            priority
          />
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
          © {new Date().getFullYear()} Vadelivery
        </p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 dark:bg-neutral-950">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <Link href="/" className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo-vadelivery.jpg"
              alt="Vadelivery"
              width={200}
              height={64}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}