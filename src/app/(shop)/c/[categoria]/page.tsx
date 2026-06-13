import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { openStoreIds, type StoreHourRow } from "@/lib/store-hours";
import { StoreCard, type StoreCardData } from "@/components/shop/store-card";

type Props = {
  params: Promise<{ categoria: string }>;
};

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
};

type StoreQuery = {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  avg_prep_minutes: number;
  delivery_fee: number;
  status: string;
  is_featured: boolean;
  categories: { name: string } | null;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { categoria } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", categoria)
    .single();

  if (!data) return { title: "Categoría" };

  return {
    title: `${(data as CategoryData).name} — Trae App`,
    description: `Comercios de ${(data as CategoryData).name} en tu zona`,
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { categoria } = await params;
  const supabase = await createClient();

  // Buscar la categoría por slug
  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, name, slug, emoji")
    .eq("slug", categoria)
    .eq("is_active", true)
    .single();

  const category = categoryData as CategoryData | null;

  if (!category) notFound();

  // Buscar comercios de esa categoría
  const { data: storesData } = await supabase
    .from("stores")
    .select(`
      id,
      slug,
      name,
      cover_url,
      rating_avg,
      rating_count,
      avg_prep_minutes,
      delivery_fee,
      status,
      is_featured,
      categories ( name )
    `)
    .eq("status", "active")
    .eq("category_id", category.id)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("rating_avg", { ascending: false });

  // "Abierto ahora" según los tramos de store_hours.
  const storeIds = ((storesData ?? []) as StoreQuery[]).map((s) => s.id);
  const { data: hoursRows } = storeIds.length
    ? await supabase
        .from("store_hours")
        .select("store_id, weekday, opens_at, closes_at")
        .in("store_id", storeIds)
    : { data: [] };
  const hourRows = (hoursRows ?? []) as StoreHourRow[];
  const openIds = openStoreIds(hourRows);
  // Comercios sin horarios cargados se consideran siempre abiertos.
  const withHours = new Set(hourRows.map((r) => r.store_id));

  const stores: StoreCardData[] = ((storesData ?? []) as StoreQuery[]).map((s) => {
    const minMin = Math.max(15, s.avg_prep_minutes - 5);
    const maxMin = s.avg_prep_minutes + 10;

    return {
      slug: s.slug,
      name: s.name,
      category: s.categories?.name ?? "",
      coverUrl: s.cover_url,
      rating: Number(s.rating_avg ?? 0),
      ratingCount: s.rating_count ?? 0,
      deliveryMinMin: minMin,
      deliveryMaxMin: maxMin,
      deliveryFee: Number(s.delivery_fee ?? 0),
      isOpen: !withHours.has(s.id) || openIds.has(s.id),
    };
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container-shop py-3 flex items-center gap-3">
          <Link
            href="/"
            className="size-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition"
            aria-label="Volver"
          >
            <ChevronLeft className="size-5 text-neutral-700" />
          </Link>
          <div className="flex items-center gap-2">
            {category.emoji && (
              <span className="text-2xl">{category.emoji}</span>
            )}
            <h1 className="text-heading-md font-semibold text-neutral-900">
              {category.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container-shop py-5">
        {stores.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">{category.emoji ?? "🏪"}</p>
            <p className="text-heading-md font-semibold text-neutral-900 mb-2">
              Próximamente
            </p>
            <p className="text-body-md text-neutral-500">
              Aún no hay comercios de {category.name} en tu zona.
            </p>
          </div>
        ) : (
          <>
            <p className="text-body-sm text-neutral-500 mb-4">
              {stores.length} comercio{stores.length !== 1 ? "s" : ""} disponible{stores.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-3">
              {stores.map((store) => (
                <StoreCard key={store.slug} store={store} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}