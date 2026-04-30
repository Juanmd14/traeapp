import { redirect } from "next/navigation";
import { requireAuth, getUserStores } from "@/server/auth/session";
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

  const storeId = stores[0]?.storeId;
  if (!storeId) redirect("/comercio/onboarding");

  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, description, image_url, price, compare_at_price, is_available, product_category_id")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <ProductsManager
      storeId={storeId}
      initial={(data ?? []) as ProductRow[]}
    />
  );
}
