import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Confirmar pedido" };

export default async function CheckoutPage() {
  const session = await requireAuth("/login?next=/checkout");

  const supabase = createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, label, street, number, apartment, city, is_default")
    .eq("profile_id", session.id)
    .order("is_default", { ascending: false });

  return (
    <CheckoutForm
      addresses={addresses ?? []}
      userEmail={session.email}
    />
  );
}
