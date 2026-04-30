import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Clock, Truck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import { formatPrice, formatDeliveryTime } from "@/lib/utils";

type Props = {
  params: { storeSlug: string };
};

export const revalidate = 60; // ISR: refresca cada 60s

export async function generateMetadata({ params }: Props) {
  const supabase = createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", params.storeSlug)
    .eq("status", "active")
    .single();

  if (!store) return { title: "Comercio no encontrado" };
  return {
    title: store.name,
    description: store.description ?? `Pedí en ${store.name}`,
  };
}

export default async function StorePage({ params }: Props) {
  const supabase = createClient();

  const { data: store } = await supabase
    .from("stores")
    .select(`
      id, slug, name, description, logo_url, cover_url, address,
      avg_prep_minutes, delivery_fee, min_order_amount,
      rating_avg, rating_count, status,
      categories ( name )
    `)
    .eq("slug", params.storeSlug)
    .eq("status", "active")
    .single();

  if (!store) notFound();

  const [{ data: productCategories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, sort_order")
      .eq("store_id", store.id)
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, name, description, image_url, price, compare_at_price, is_available, product_category_id, sort_order")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  // Agrupar productos por categoría
  const categoriesWithProducts = (productCategories ?? []).map((cat) => ({
    ...cat,
    products: (products ?? []).filter((p) => p.product_category_id === cat.id),
  }));

  // Productos sin categoría
  const uncategorized = (products ?? []).filter((p) => !p.product_category_id);
  if (uncategorized.length > 0) {
    categoriesWithProducts.push({
      id: "uncategorized",
      name: "Otros productos",
      sort_order: 999,
      products: uncategorized,
    });
  }

  const minMin = Math.max(15, store.avg_prep_minutes - 5);
  const maxMin = store.avg_prep_minutes + 10;

  return (
    <div className="bg-neutral-50 min-h-screen pb-24">
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
        <div className="bg-white rounded-xl shadow-card p-4 sm:p-5">
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
              <h1 className="text-heading-lg font-semibold text-neutral-900 truncate">
                {store.name}
              </h1>
              {store.description && (
                <p className="text-body-sm text-neutral-500 line-clamp-2 mt-0.5">
                  {store.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {store.rating_count > 0 && (
              <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-1 rounded-full">
                <Star className="size-3 fill-current text-warning-500" />
                {Number(store.rating_avg).toFixed(1)}
                <span className="text-neutral-500">· {store.rating_count}</span>
              </span>
            )}
            <span className="flex items-center gap-1 bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-1 rounded-full">
              <Clock className="size-3" />
              {formatDeliveryTime(minMin, maxMin)}
            </span>
            <span
              className={
                store.delivery_fee === 0
                  ? "flex items-center gap-1 bg-accent-100 text-accent-800 text-body-xs font-medium px-2 py-1 rounded-full"
                  : "flex items-center gap-1 bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-1 rounded-full"
              }
            >
              <Truck className="size-3" />
              {Number(store.delivery_fee) === 0 ? "Envío gratis" : `Envío ${formatPrice(store.delivery_fee)}`}
            </span>
            {store.min_order_amount > 0 && (
              <span className="bg-neutral-100 text-neutral-700 text-body-xs font-medium px-2 py-1 rounded-full">
                Mín. {formatPrice(store.min_order_amount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <div className="container-shop py-5 space-y-6">
        {categoriesWithProducts.length === 0 || (products ?? []).length === 0 ? (
          <p className="text-center text-body-md text-neutral-500 py-12">
            Este comercio aún no cargó productos.
          </p>
        ) : (
          categoriesWithProducts
            .filter((c) => c.products.length > 0)
            .map((cat) => (
              <section key={cat.id}>
                <h2 className="text-heading-md font-semibold text-neutral-900 mb-3">
                  {cat.name}
                </h2>
                <div className="space-y-2.5">
                  {cat.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={{
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        imageUrl: p.image_url,
                        price: Number(p.price),
                        compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
                        isAvailable: p.is_available,
                      }}
                      storeId={store.id}
                      storeName={store.name}
                      storeSlug={store.slug}
                      deliveryFee={Number(store.delivery_fee)}
                      minOrderAmount={Number(store.min_order_amount)}
                    />
                  ))}
                </div>
              </section>
            ))
        )}
      </div>
    </div>
  );
}
