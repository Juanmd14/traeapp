import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Clock, Truck, Tag } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { StoreProducts } from "@/components/shop/store-products";
import { formatPrice, formatDeliveryTime } from "@/lib/utils";

type Props = {
  params: { storeSlug: string };
};

type StoreData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  avg_prep_minutes: number;
  delivery_fee: number;
  min_order_amount: number;
  rating_avg: number | null;
  rating_count: number;
  status: string;
  categories: { name: string } | null;
};

type PromoData = {
  id: string;
  code: string | null;
  type: "percent" | "amount" | "free_delivery" | "bxgy";
  value: number | null;
};

function promoLabel(promo: PromoData): string {
  switch (promo.type) {
    case "percent":
      return `${promo.value}% OFF`;
    case "amount":
      return `$${promo.value} OFF`;
    case "free_delivery":
      return "Envío gratis";
    case "bxgy":
      return "Promoción especial";
  }
}

export const revalidate = 30;

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", params.storeSlug)
    .eq("status", "active")
    .single();

  const store = data as Pick<
    StoreData,
    "name" | "description"
  > | null;

  if (!store) {
    return {
      title: "Comercio no encontrado",
    };
  }

  return {
    title: store.name,
    description: store.description ?? `Pedí en ${store.name}`,
  };
}

export default async function StorePage({ params }: Props) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stores")
    .select(`
      id,
      slug,
      name,
      description,
      logo_url,
      cover_url,
      address,
      avg_prep_minutes,
      delivery_fee,
      min_order_amount,
      rating_avg,
      rating_count,
      status,
      categories ( name )
    `)
    .eq("slug", params.storeSlug)
    .eq("status", "active")
    .single();

  const store = data as StoreData | null;

  if (!store) {
    notFound();
  }

  const now = new Date().toISOString();
  const { data: promosData } = await supabase
    .from("promotions")
    .select("id, code, type, value")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .not("code", "is", null)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .limit(4);

  const promos = (promosData ?? []) as PromoData[];

  const minMin = Math.max(
    15,
    store.avg_prep_minutes - 5
  );

  const maxMin = store.avg_prep_minutes + 10;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen pb-24">
      {/* Cover */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary-300 to-primary-600">
        {store.cover_url && (
          <Image
            src={store.cover_url}
            alt={store.name}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}

        <Link
          href="/"
          className="absolute top-3 left-3 size-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-card hover:bg-white transition"
          aria-label="Volver"
        >
          <ChevronLeft className="size-5 text-neutral-900" />
        </Link>
      </div>

      {/* Header info */}
      <div className="container-shop -mt-8 relative">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt=""
                width={56}
                height={56}
                className="rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="size-14 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-heading-md shrink-0">
                {store.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-heading-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {store.name}
              </h1>

              {store.description && (
                <p className="text-body-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                  {store.description}
                </p>
              )}
            </div>
          </div>

          {promos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              {promos.map((promo) => (
                <span
                  key={promo.id}
                  className="flex items-center gap-1.5 bg-accent-50 text-accent-800 border border-accent-200 text-body-xs font-medium px-2.5 py-1 rounded-full"
                >
                  <Tag className="size-3" />
                  {promo.code && (
                    <span className="font-bold">{promo.code}</span>
                  )}
                  <span>— {promoLabel(promo)}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {store.rating_count > 0 && (
<span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-body-xs font-medium px-2 py-1 rounded-full">
              <Star className="size-3 fill-current text-warning-500" />
              {Number(store.rating_avg).toFixed(1)}

              <span className="text-neutral-500 dark:text-neutral-400">
                  · {store.rating_count}
                </span>
              </span>
            )}

            <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-body-xs font-medium px-2 py-1 rounded-full">
              <Clock className="size-3" />
              {formatDeliveryTime(minMin, maxMin)}
            </span>

            <span
              className={
                store.delivery_fee === 0
                  ? "flex items-center gap-1 bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200 text-body-xs font-medium px-2 py-1 rounded-full"
                  : "flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-body-xs font-medium px-2 py-1 rounded-full"
              }
            >
              <Truck className="size-3" />

              {Number(store.delivery_fee) === 0
                ? "Envío gratis"
                : `Envío ${formatPrice(
                    store.delivery_fee
                  )}`}
            </span>

            {store.min_order_amount > 0 && (
              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-body-xs font-medium px-2 py-1 rounded-full">
                Mín. {formatPrice(store.min_order_amount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <div className="container-shop py-5">
        <StoreProducts
          storeId={store.id}
          storeName={store.name}
          storeSlug={store.slug}
          deliveryFee={Number(store.delivery_fee)}
          minOrderAmount={Number(store.min_order_amount)}
        />
      </div>
    </div>
  );
}