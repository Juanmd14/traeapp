import { ShopHeader } from "@/components/shared/shop-header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { CartFloatingButton } from "@/components/cart/cart-floating-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getSession } from "@/server/auth/session";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <ShopHeader />
      {/* Toggle debajo del logo, fuera del navbar */}
      <div className="fixed left-3 z-30 top-24 lg:top-[68px]">
        <ThemeToggle />
      </div>
      <main className="flex-1 pb-20">{children}</main>
      <CartFloatingButton />
      <BottomNav isLogged={!!session} role={session?.role ?? null} />
    </div>
  );
}