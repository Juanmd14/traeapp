import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/server/auth/session";
import { StoreStatusSelect } from "@/components/admin/store-status-select";
import { StoreOwnersManager } from "@/components/admin/store-owners-manager";
import { StoreCommissionEditor } from "@/components/admin/store-commission-editor";
import { StoreOperationEditor } from "@/components/admin/store-operation-editor";

export const dynamic = "force-dynamic";

type Owner = {
  user_id: string;
  role: string;
  profiles: { full_name: string; email: string } | null;
};

type StoreDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  email: string | null;
  phone: string | null;
  address: string;
  delivery_fee: number;
  commission_pct: number;
  avg_prep_minutes: number;
  min_order_amount: number;
  accepts_cash: boolean;
  accepts_mp: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  categories: { name: string } | null;
  store_users: Owner[];
};

export default async function AdminComercioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;

  const { data } = await (supabaseAdmin.from("stores") as any)
    .select(`
      id, name, slug, status, email, phone, address,
      delivery_fee, commission_pct, avg_prep_minutes, min_order_amount,
      accepts_cash, accepts_mp,
      rating_avg, rating_count, created_at,
      categories ( name ),
      store_users (
        user_id, role,
        profiles:user_id ( full_name, email )
      )
    `)
    .eq("id", id)
    .single();

  if (!data) notFound();
  const store = data as StoreDetail;

  const info = [
    { label: "Categoría", value: store.categories?.name ?? "—" },
    { label: "Email", value: store.email ?? "—" },
    { label: "Teléfono", value: store.phone ?? "—" },
    { label: "Dirección", value: store.address },
    { label: "Calificación", value: store.rating_count > 0 ? `${Number(store.rating_avg).toFixed(1)} (${store.rating_count} reseñas)` : "Sin reseñas" },
    { label: "Registrado", value: new Date(store.created_at).toLocaleDateString("es-AR") },
  ];

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/comercios"
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 mb-5"
      >
        <ChevronLeft className="size-4" />
        Comercios
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-heading-xl font-bold text-neutral-900">{store.name}</h1>
          <p className="text-body-sm text-neutral-500 mt-0.5">/{store.slug}</p>
        </div>

        <div className="flex items-center gap-2">
          <StoreStatusSelect storeId={store.id} currentStatus={store.status} />
          <Link
            href={`/s/${store.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-body-sm text-primary font-medium hover:underline"
          >
            Ver tienda
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Info */}
      <section className="bg-white rounded-xl border border-neutral-200 p-5 mb-4">
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-3">Información</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {info.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-body-xs text-neutral-500">{label}</dt>
              <dd className="text-body-sm text-neutral-900 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Operación */}
      <section className="bg-white rounded-xl border border-neutral-200 p-5 mb-4">
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-1">
          Operación
        </h2>
        <p className="text-body-xs text-neutral-500 mb-4">
          Envío, pedido mínimo, tiempo de preparación y métodos de pago.
        </p>
        <StoreOperationEditor
          storeId={store.id}
          initial={{
            deliveryFee: Number(store.delivery_fee ?? 0),
            minOrderAmount: Number(store.min_order_amount ?? 0),
            avgPrepMinutes: Number(store.avg_prep_minutes ?? 25),
            acceptsCash: store.accepts_cash ?? true,
            acceptsMp: store.accepts_mp ?? true,
          }}
        />
      </section>

      {/* Comisión */}
      <section className="bg-white rounded-xl border border-neutral-200 p-5 mb-4">
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-3">
          Comisión Mercado Pago
        </h2>
        <StoreCommissionEditor
          storeId={store.id}
          initial={Number(store.commission_pct ?? 12)}
        />
      </section>

      {/* Dueños */}
      <section className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-heading-sm font-semibold text-neutral-900 mb-3">
          Dueños y administradores
        </h2>
        <StoreOwnersManager storeId={store.id} owners={store.store_users} />
      </section>
    </div>
  );
}
