import { redirect } from "next/navigation";
import { requireAuth, getUserStores, getActiveStoreId } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  ProductsManager,
  type ProductRow,
} from "@/components/store-admin/products-manager";

export const metadata = { title: "Productos" };
export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session = await requireAuth("/login?next=/comercio/productos");
  const stores = await getUserStores(session.id);

  if (stores.length === 0 && session.role !== "admin") {
    redirect("/comercio/onboarding");
  }

  const storeId = getActiveStoreId(stores);
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();
  const { data: productsData } = await supabase
    .from("products")
    .select("*, product_quantity_options(id, quantity, price, is_default, sort_order), product_modifiers(id, name, product_modifier_options(id, name, price_delta, is_removal))")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("created_at", { ascending: false }) as { data: any[] | null };

  const products: ProductRow[] = ((productsData ?? []) as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    image_url: p.image_url,
    price: p.price,
    compare_at_price: p.compare_at_price,
    is_available: p.is_available,
    product_category_id: p.product_category_id,
    has_quantity_options: p.has_quantity_options ?? false,
    hide_manual_quantity: p.hide_manual_quantity ?? false,
    quantity_options: p.product_quantity_options ?? [],
    modifiers_data: (p.product_modifiers ?? []).flatMap((mod: any) =>
      (mod.product_modifier_options ?? []).map((opt: any) => ({
        modifier_id: mod.id,
        modifier_name: mod.name,
        ...opt,
      }))
    ),
  }));

  return (
    <ProductsManager
      storeId={storeId}
      initial={products}
    />
  );
}
