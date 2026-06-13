import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone } from "lucide-react";

import { requireAuth } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { OrderTrackerLive } from "@/components/order/order-tracker-live";
import { OrderMapSection } from "@/components/order/order-map-section";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Seguimiento del pedido" };

type StoreData = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
};

type OrderData = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address_text: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  customer_notes: string | null;
  estimated_delivery_at: string | null;
  confirmed_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  driver_id: string | null;
  customer_id: string;
  stores: StoreData | null;
};

type OrderItemData = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: statusParam } = await searchParams;
  const session = await requireAuth(`/login?next=/pedido/${id}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      payment_status,
      payment_method,
      subtotal,
      delivery_fee,
      discount,
      total,
      delivery_address_text,
      delivery_lat,
      delivery_lng,
      customer_notes,
      estimated_delivery_at,
      confirmed_at,
      ready_at,
      picked_up_at,
      delivered_at,
      driver_id,
      customer_id,
      stores ( id, name, slug, phone )
    `)
    .eq("id", id)
    .single();

  const order = data as OrderData | null;

  if (!order) notFound();

  if (order.customer_id !== session.id && session.role !== "admin") {
    notFound();
  }

  const { data: itemsData } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, unit_price, total")
    .eq("order_id", order.id);

  const items = (itemsData ?? []) as OrderItemData[];

  const store = order.stores;

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  const hasReview = existingReview !== null;

  return (
    <div className="container-shop py-4 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 mb-3"
      >
        <ChevronLeft className="size-4" />
        Volver
      </Link>

      <header className="mb-5">
        <p className="text-body-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Pedido #{order.order_number}
        </p>

        <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {store?.name}
        </h1>
      </header>

      {statusParam === "success" && (
        <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40 rounded-md p-3 mb-4">
          <p className="text-body-md font-medium text-accent-900 dark:text-accent-200">
            ¡Pago aprobado! 🎉
          </p>

          <p className="text-body-sm text-accent-700 dark:text-accent-300 mt-0.5">
            El comercio ya recibió tu pedido.
          </p>
        </div>
      )}

      {statusParam === "pending" && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 rounded-md p-3 mb-4">
          <p className="text-body-md font-medium text-warning-900 dark:text-warning-200">
            Pago pendiente
          </p>

          <p className="text-body-sm text-warning-700 dark:text-warning-300 mt-0.5">
            Estamos esperando confirmación de Mercado Pago.
          </p>
        </div>
      )}

      <section className="mb-6">
        <OrderTrackerLive
          orderId={order.id}
          storeId={store?.id ?? ""}
          initialHasReview={hasReview}
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

      {/* Mapa en tiempo real — aparece cuando el repartidor es asignado */}
      <OrderMapSection
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
        destLat={order.delivery_lat}
        destLng={order.delivery_lng}
      />

      {/* Dirección */}
      <section className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 p-4 mb-3">
        <p className="text-body-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Entrega
        </p>

        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />

          <div>
            <p className="text-body-md text-neutral-900 dark:text-neutral-100">
              {order.delivery_address_text}
            </p>

            {order.customer_notes && (
              <p className="text-body-sm text-neutral-500 dark:text-neutral-400 mt-1">
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
          className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 p-4 mb-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
        >
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-neutral-500 dark:text-neutral-400" />

            <span className="text-body-md text-neutral-900 dark:text-neutral-100">
              Llamar al comercio
            </span>
          </div>

          <span className="text-body-sm text-neutral-500 dark:text-neutral-400">
            {store.phone}
          </span>
        </a>
      )}

      {/* Detalle */}
      <section className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 p-4 mb-3">
        <p className="text-body-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
          Detalle del pedido
        </p>

        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex justify-between text-body-md"
            >
              <span className="text-neutral-700 dark:text-neutral-300">
                <span className="font-medium">{it.quantity}×</span>{" "}
                {it.product_name}
              </span>

              <span className="text-neutral-900 dark:text-neutral-100">
                {formatPrice(it.total)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-neutral-200 dark:border-neutral-700 mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>

            <span className="text-neutral-700 dark:text-neutral-300">
              {formatPrice(order.subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Envío</span>

            <span className="text-neutral-700 dark:text-neutral-300">
              {Number(order.delivery_fee) === 0
                ? "Gratis"
                : formatPrice(order.delivery_fee)}
            </span>
          </div>

          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Descuento</span>

              <span className="text-accent-600 dark:text-accent-400">
                - {formatPrice(order.discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-heading-sm font-semibold pt-1.5 border-t border-neutral-100 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
            <span>Total</span>

            <span>{formatPrice(order.total)}</span>
          </div>

          <p className="text-body-xs text-neutral-500 dark:text-neutral-400 pt-1">
            {order.payment_method === "cash"
              ? "Pagás en efectivo al recibir"
              : "Pagado con Mercado Pago"}
          </p>
        </div>
      </section>
    </div>
  );
}
