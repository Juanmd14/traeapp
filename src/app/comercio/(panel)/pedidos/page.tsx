export default function PedidosPage() {
  return (
    <div className="max-w-7xl">
      <header className="mb-6">
        <h1 className="text-heading-xl font-semibold text-neutral-900">Pedidos en vivo</h1>
        <p className="text-body-md text-neutral-500 mt-1">
          Los pedidos nuevos aparecen acá automáticamente.
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-card p-12 text-center">
        <p className="text-body-md text-neutral-500">
          Aún no recibiste pedidos hoy.
        </p>
      </div>
    </div>
  );
}
