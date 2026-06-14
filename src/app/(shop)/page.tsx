import { createClient } from "@/lib/supabase/server";
import { openStoreIds, nextOpenLabel, type StoreHourRow } from "@/lib/store-hours";
import { HeroBanner } from "@/components/shop/hero-banner";
import { CategoryPill, type Category } from "@/components/shop/category-pill";
import { StoreCard, type StoreCardData } from "@/components/shop/store-card";

export const revalidate = 30;

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
  boost_rank: number | null;
  boost_expires_at: string | null;
  categories: { name: string } | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: stores }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, emoji, bg_class, sort_order")
      .eq("is_active", true)
      .order("sort_order"),

    supabase
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
        boost_rank,
        boost_expires_at,
        categories ( name )
      `)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("boost_rank", { ascending: false })
      .order("is_featured", { ascending: false })
      .limit(10),
  ]);

  const mappedCategories: Category[] = ((categories ?? []) as any[]).map(
    (c) => ({
      slug: c.slug,
      name: c.name,
      emoji: c.emoji ?? "🏪",
      bgClass: c.bg_class ?? "bg-neutral-100",
    })
  );

  // "Abierto ahora" según los tramos de store_hours de los comercios listados.
  const storeIds = ((stores ?? []) as StoreQuery[]).map((s) => s.id);
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
  // Agrupar tramos por comercio para calcular la próxima apertura.
  const hoursByStore = new Map<string, StoreHourRow[]>();
  for (const r of hourRows) {
    if (!r.store_id) continue;
    const list = hoursByStore.get(r.store_id) ?? [];
    list.push(r);
    hoursByStore.set(r.store_id, list);
  }

  // Ventas por comercio: cantidad de pedidos entregados/completados.
  // Se usa para ordenar el listado (el que más vende, primero).
  const { data: salesRows } = storeIds.length
    ? await supabase
        .from("orders")
        .select("store_id")
        .in("store_id", storeIds)
        .in("status", ["delivered", "completed"])
    : { data: [] };
  const salesByStore = new Map<string, number>();
  for (const row of (salesRows ?? []) as { store_id: string }[]) {
    salesByStore.set(row.store_id, (salesByStore.get(row.store_id) ?? 0) + 1);
  }

  const now = Date.now();

  const mappedStores: (StoreCardData & {
    salesCount: number;
    boost: number;
  })[] = ((stores ?? []) as StoreQuery[]).map((s) => {
    const minMin = Math.max(15, s.avg_prep_minutes - 5);
    const maxMin = s.avg_prep_minutes + 10;

    // El destacado pago solo cuenta si no venció.
    const boostActive =
      (s.boost_rank ?? 0) > 0 &&
      (!s.boost_expires_at || new Date(s.boost_expires_at).getTime() > now);

    const isOpen = !withHours.has(s.id) || openIds.has(s.id);

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
      isOpen,
      closedLabel: isOpen
        ? null
        : nextOpenLabel(hoursByStore.get(s.id) ?? []),
      salesCount: salesByStore.get(s.id) ?? 0,
      boost: boostActive ? s.boost_rank ?? 0 : 0,
    };
  });

  // Orden: 1) abiertos primero, 2) destacado pago (boost), 3) el que más vende.
  const featured = [...mappedStores].sort((a, b) => {
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    if (a.boost !== b.boost) return b.boost - a.boost;
    return b.salesCount - a.salesCount;
  });

  return (
    <div className="container-shop py-4 space-y-6">
      {/* HERO BANNER CON ICONOS INTERCALADOS */}
      <HeroBanner />

      {/* CATEGORÍAS */}
      <section>
        <h2 className="text-heading-md font-display font-bold mb-3">Categorías</h2>
        <div className="scroll-snap-x">
          {mappedCategories.map((c) => (
            <CategoryPill key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* COMERCIOS DESTACADOS */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-heading-md font-display font-bold">
              Comercios destacados
            </h2>
          </div>
          <div className="grid gap-3">
            {featured.map((store) => (
              <StoreCard key={store.slug} store={store} />
            ))}
          </div>
        </section>
      )}

      {mappedStores.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 text-center">
          <p className="text-body-md text-neutral-500 dark:text-neutral-400">
            Pronto vamos a tener comercios en tu zona.
          </p>
        </div>
      )}
    </div>
  );
}