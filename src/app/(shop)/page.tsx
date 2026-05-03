import { createClient } from "@/lib/supabase/server";
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
        categories ( name )
      `)
      .eq("status", "active")
      .is("deleted_at", null)
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

  const mappedStores: StoreCardData[] = (
    (stores ?? []) as StoreQuery[]
  ).map((s) => {
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
      isOpen: true,
    };
  });

  const featured = mappedStores.filter((s) => s);

  return (
    <div className="container-shop py-4 space-y-6">
      {/* HERO BANNER CON ICONOS INTERCALADOS */}
      <HeroBanner />

      {/* CATEGORÍAS */}
      <section>
        <h2 className="text-heading-md font-semibold mb-3">Categorías</h2>
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
            <h2 className="text-heading-md font-semibold">
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
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-body-md text-neutral-500">
            Pronto vamos a tener comercios en tu zona.
          </p>
        </div>
      )}
    </div>
  );
}