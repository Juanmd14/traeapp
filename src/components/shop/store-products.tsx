import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import type { ModifierGroup } from "@/components/shop/product-modifier-modal";

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  compare_at_price: number | null;
  is_available: boolean;
  product_category_id: string | null;
  sort_order: number;
  product_modifiers: ModifierGroup[];
};

type ProductCategoryData = {
  id: string;
  name: string;
  sort_order: number;
};

type Props = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  deliveryFee: number;
  minOrderAmount: number;
};

function ProductsContent({ storeId, storeName, storeSlug, deliveryFee, minOrderAmount }: Props) {
  return (
    <div className="space-y-6">
      <ProductCategories
        storeId={storeId}
        storeName={storeName}
        storeSlug={storeSlug}
        deliveryFee={deliveryFee}
        minOrderAmount={minOrderAmount}
      />
    </div>
  );
}

async function ProductCategories({ storeId, storeName, storeSlug, deliveryFee, minOrderAmount }: Props) {
  const supabase = await createClient();

  const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, sort_order")
      .eq("store_id", storeId)
      .order("sort_order"),

    supabase
      .from("products")
      .select(`id, name, description, image_url, price, compare_at_price, is_available, product_category_id, sort_order,
        product_modifiers ( id, name, is_required, type, sort_order,
          product_modifier_options ( id, name, price_delta, sort_order )
        )`)
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const productCategories = (categoriesData ?? []) as ProductCategoryData[];
  const products = (productsData ?? []) as ProductData[];

  const categoriesWithProducts = productCategories.map((cat) => ({
    ...cat,
    products: products.filter((p) => p.product_category_id === cat.id),
  }));

  const uncategorized = products.filter((p) => !p.product_category_id);
  if (uncategorized.length > 0) {
    categoriesWithProducts.push({
      id: "uncategorized",
      name: "Otros productos",
      sort_order: 999,
      products: uncategorized,
    });
  }

  if (categoriesWithProducts.length === 0 || products.length === 0) {
    return (
      <p className="text-center text-body-md text-neutral-500 py-12">
        Este comercio aún no cargó productos.
      </p>
    );
  }

  return (
    <>
      {categoriesWithProducts
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
                  modifiers={p.product_modifiers ?? []}
                  storeId={storeId}
                  storeName={storeName}
                  storeSlug={storeSlug}
                  deliveryFee={deliveryFee}
                  minOrderAmount={minOrderAmount}
                />
              ))}
            </div>
          </section>
        ))}
    </>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, catIdx) => (
        <section key={catIdx}>
          <div className="h-6 w-40 bg-neutral-200 rounded mb-3 animate-pulse" />
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, prodIdx) => (
              <div
                key={prodIdx}
                className="h-20 bg-neutral-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${(catIdx * 2 + prodIdx) * 50}ms` }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function StoreProducts(props: Props) {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsContent {...props} />
    </Suspense>
  );
}