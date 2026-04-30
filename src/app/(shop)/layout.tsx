import { ShopHeader } from "@/components/shared/shop-header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { CartFloatingButton } from "@/components/cart/cart-floating-button";
import { getSession } from "@/server/auth/session";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <ShopHeader />
      <main className="flex-1 pb-20">{children}</main>
      <CartFloatingButton />
      <BottomNav isLogged={!!session} />
    </div>
  );
}
