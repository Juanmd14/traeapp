import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone } from "lucide-react";

import { requireAuth } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OrderTrackerLive } from "@/components/order/order-tracker-live";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Seguimiento del pedido" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const session = await requireAuth(`/login?next=/pedido/${params.id}`);
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, payment_status, payment_method,
      subtotal, delivery_fee, discount, total,
      delivery_address_text, customer_notes,
      estimated_delivery_at, confirmed_at, ready_at, picked_up_at, delivered_at,
      driver_id, customer_id,
      stores ( id, name, slug, phone )
    `)
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  // Sólo el cliente, comercio o admin pueden ver
  if (order.customer_id !== session.id && session.role !== "admin") {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, unit_price, total")
    .eq("order_id", order.id);

  const store = order.stores as { id: string; name: string; slug: string; phone: string | null } | null;

  return (
    <div className="container-shop py-4 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 mb-3"
      >
        <ChevronLeft className="size-4" />
        Volver
      </Link>

      <header className="mb-5">
        <p className="text-body-xs text-neutral-500 uppercase tracking-wider">
          Pedido #{order.order_number}
        </p>
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          {store?.name}
        </h1>
      </header>

      {searchParams.status === "success" && (
        <div className="bg-accent-50 border border-accent-200 rounded-md p-3 mb-4">
          <p className="text-body-md font-medium text-accent-900">
            ¡Pago aprobado! 🎉
          </p>
          <p className="text-body-sm text-accent-700 mt-0.5">
            El comercio ya recibió tu pedido.
          </p>
        </div>
      )}

      {searchParams.status === "pending" && (
        <div className="bg-warning-50 border border-warning-200 rounded-md p-3 mb-4">
          <p className="text-body-md font-medium text-warning-900">
            Pago pendiente
          </p>
          <p className="text-body-sm text-warning-700 mt-0.5">
            Estamos esperando confirmación de Mercado Pago.
          </p>
        </div>
      )}

      <section className="mb-6">
        <OrderTrackerLive
          orderId={order.id}
          initial={{
            status: order.status,
            payment_status: order.payment_status,
            estimated_delivery_at: order.estimated_delivery_at,
            driver_id: order.driver_id,
            confirmed_at: order.confirmed_at,
            ready_at: order.ready_at,
            picked_up_at: order.picked_up_at,
            delivered_at: order.delivered_at,
          }}
        />
      </section>

      {/* Dirección */}
      <section className="bg-white rounded-md border border-neutral-200 p-4 mb-3">
        <p className="text-body-xs text-neutral-500 uppercase tracking-wider mb-1.5">
          Entrega
        </p>
        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-neutral-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-body-md text-neutral-900">{order.delivery_address_text}</p>
            {order.customer_notes && (
              <p className="text-body-sm text-neutral-500 mt-1">
                Nota: {order.customer_notes}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Contacto comercio */}
      {store?.phone && (
        <a
          href={`tel:${store.phone}`}
          className="flex items-center justify-between bg-white rounded-md border border-neutral-200 p-4 mb-3 hover:bg-neutral-50 transition"
        >
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-neutral-500" />
            <span className="text-body-md text-neutral-900">Llamar al comercio</span>
          </div>
          <span className="text-body-sm text-neutral-500">{store.phone}</span>
        </a>
      )}

      {/* Detalle */}
      <section className="bg-white rounded-md border border-neutral-200 p-4 mb-3">
        <p className="text-body-xs text-neutral-500 uppercase tracking-wider mb-2">
          Detalle del pedido
        </p>
        <ul className="space-y-2">
          {items?.map((it) => (
            <li key={it.id} className="flex justify-between text-body-md">
              <span className="text-neutral-700">
                <span className="font-medium">{it.quantity}×</span> {it.product_name}
              </span>
              <span className="text-neutral-900">{formatPrice(it.total)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-200 mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-neutral-700">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-500">Envío</span>
            <span className="text-neutral-700">
              {Number(order.delivery_fee) === 0 ? "Gratis" : formatPrice(order.delivery_fee)}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-500">Descuento</span>
              <span className="text-accent-600">- {formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-heading-sm font-semibold pt-1.5 border-t border-neutral-100">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="text-body-xs text-neutral-500 pt-1">
            {order.payment_method === "cash" ? "Pagás en efectivo al recibir" : "Pagado con Mercado Pago"}
          </p>
        </div>
      </section>
    </div>
  );
}
