import { requireAuth } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  AddressesManager,
  type AddressItem,
} from "@/components/account/addresses-manager";

export const metadata = { title: "Mis direcciones" };

export default async function DireccionesPage() {
  const session = await requireAuth("/login?next=/direcciones");

  const supabase = createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, label, street, number, apartment, neighborhood, reference, city, is_default")
    .eq("profile_id", session.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <AddressesManager initial={(data ?? []) as AddressItem[]} />;
}
