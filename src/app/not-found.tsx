import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-display-lg font-bold text-primary-600 mb-2">404</p>
        <h2 className="text-heading-xl font-semibold text-neutral-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-body-md text-neutral-500 mb-6">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-md transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
