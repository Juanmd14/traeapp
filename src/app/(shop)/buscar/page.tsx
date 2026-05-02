import { createClient } from "@/lib/supabase/server";
import { StoreCard } from "@/components/shop/store-card";
import { ProductCard } from "@/components/shop/product-card";
import { Search } from "lucide-react";

export const metadata = { title: "Buscar" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string };
};

export default async function BuscarPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? "";
  const supabase = createClient();

  let stores: any[] = [];
  let products: any[] = [];

  if (q.length >= 2) {
    // Buscar comercios
    const { data: storeResults } = await supabase
      .from("stores")
      .select("id, name, slug, description, logo_url, cover_url, delivery_fee, avg_delivery_minutes, rating, review_count, min_order_amount, status")
      .eq("status", "active")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(6);

    stores = storeResults ?? [];

    // Buscar productos
    const { data: productResults } = await supabase
      .from("products")
      .select(`
        id, name, description, price, compare_at_price, image_url, is_available,
        stores ( id, name, slug, status )
      `)
      .eq("is_active", true)
      .eq("is_available", true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(12);

    products = (productResults ?? []).filter(
      (p: any) => p.stores?.status === "active"
    );
  }

  const hasResults = stores.length > 0 || products.length > 0;
  const hasQuery = q.length >= 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {!hasQuery ? (
        <div className="text-center py-16">
          <div className="size-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="size-7 text-neutral-400" />
          </div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 mb-2">
            ¿Qué estás buscando?
          </h1>
          <p className="text-body-md text-neutral-500">
            Buscá comercios o productos por nombre
          </p>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-16">
          <div className="size-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="size-7 text-neutral-400" />
          </div>
          <h1 className="text-heading-xl font-semibold text-neutral-900 mb-2">
            Sin resultados para "{q}"
          </h1>
          <p className="text-body-md text-neutral-500">
            Probá con otro término o revisá la ortografía
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <h1 className="text-heading-xl font-semibold text-neutral-900">
            Resultados para <span className="text-primary-600">"{q}"</span>
          </h1>

          {/* Comercios */}
          {stores.length > 0 && (
            <section>
              <h2 className="text-heading-md font-semibold text-neutral-800 mb-3">
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
              <h2 className="text-heading-md font-semibold text-neutral-800 mb-3">
                Productos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product: any) => (
                  <div key={product.id} className="space-y-1">
                    <p className="text-body-xs text-neutral-500 truncate px-1">
                      en{" "}
                      <a
                        href={`/s/${product.stores?.slug}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {product.stores?.name}
                      </a>
                    </p>
                    <ProductCard
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
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
