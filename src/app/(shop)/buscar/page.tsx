import { createClient } from "@/lib/supabase/server";
import { StoreCard } from "@/components/shop/store-card";
import { SearchProductCard } from "@/components/shop/search-product-card";
import { Search } from "lucide-react";

export const metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type ProductWithStore = {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  stores: {
    id: string;
    name: string;
    slug: string;
    status: string;
    delivery_fee: number;
    min_order_amount: number;
  } | null;
};

export default async function BuscarPage({ searchParams }: Props) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const supabase = await createClient();

  let stores: any[] = [];
  let products: ProductWithStore[] = [];

  if (q.length >= 2) {
    // 🔎 Comercios
    const { data: storeResults } = await supabase
      .from("stores")
      .select(
        "id, name, slug, description, logo_url, cover_url, delivery_fee, avg_delivery_minutes, rating, review_count, min_order_amount, status"
      )
      .eq("status", "active")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(6);

    stores = storeResults ?? [];

    // 🔎 Productos (FIX acá)
    const { data: productResults } = await supabase
      .from("products")
      .select(`
        id, name, description, price, compare_at_price, image_url, is_available,
        stores (
          id,
          name,
          slug,
          status,
          delivery_fee,
          min_order_amount
        )
      `)
      .eq("is_active", true)
      .eq("is_available", true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(12);

   const typedProducts = (productResults ?? []) as ProductWithStore[];

products = typedProducts.filter(
  (p) => p.stores?.status === "active"
);
  }

  const hasResults = stores.length > 0 || products.length > 0;
  const hasQuery = q.length >= 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!hasQuery ? (
        <div className="text-center py-16">
          <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="size-7 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            ¿Qué estás buscando?
          </h1>
          <p className="text-body-md text-neutral-500 dark:text-neutral-400">
            Buscá comercios o productos por nombre
          </p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-16">
          <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="size-7 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Sin resultados para &quot;{q}&quot;
          </h1>
          <p className="text-body-md text-neutral-500 dark:text-neutral-400">
            Probá con otro término o revisá la ortografía
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <h1 className="text-heading-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Resultados para{" "}
            <span className="text-primary-600">&quot;{q}&quot;</span>
          </h1>

          {/* Comercios */}
          {stores.length > 0 && (
            <section>
              <h2 className="text-heading-md font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                Comercios
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}

          {/* Productos */}
          {products.length > 0 && (
            <section>
              <h2 className="text-heading-md font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                Productos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
                  <SearchProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description,
                      price: product.price,
                      compareAtPrice: product.compare_at_price,
                      imageUrl: product.image_url,
                      isAvailable: product.is_available,
                    }}
                    storeId={product.stores?.id ?? ""}
                    storeSlug={product.stores?.slug ?? ""}
                    storeName={product.stores?.name ?? ""}
                    deliveryFee={product.stores?.delivery_fee ?? 0}
                    minOrderAmount={product.stores?.min_order_amount ?? 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}