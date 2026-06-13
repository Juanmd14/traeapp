import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getUserStores } from "@/server/auth/session";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth("/login?next=/comercio/onboarding");

  // Si ya tiene un comercio, lo mandamos al panel
  if (session.role !== "admin") {
    const stores = await getUserStores(session.id);
    if (stores.length > 0) {
      redirect("/comercio/pedidos");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="container-page py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold text-body-sm">
              T
            </div>
            <span className="text-heading-sm font-semibold">Trae App</span>
          </Link>
          <p className="text-body-sm text-neutral-500">
            ¡Hola, <span className="font-medium text-neutral-900">{session.fullName}</span>!
          </p>
        </div>
      </header>

      <main className="container-page py-8">{children}</main>
    </div>
  );
}
