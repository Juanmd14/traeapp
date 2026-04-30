import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/server/auth/session";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth("/login");

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200">
        <div className="container-shop py-3 flex items-center gap-2">
          <Link
            href="/"
            className="size-9 -ml-2 rounded-md hover:bg-neutral-100 flex items-center justify-center transition"
            aria-label="Volver"
          >
            <ChevronLeft className="size-5 text-neutral-700" />
          </Link>
          <h1 className="text-heading-md font-semibold text-neutral-900">Mi cuenta</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
