import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/server/auth/session";
import { CreateStoreForm } from "@/components/admin/create-store-form";

export const metadata = { title: "Nuevo comercio · Admin" };

export default async function NuevoComercioPage() {
  await requireRole("admin");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/comercios"
          className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-800 transition">
          <ChevronLeft className="size-4" />
          Comercios
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-body-sm text-neutral-800 font-medium">Nuevo comercio</span>
      </div>

      <h1 className="text-heading-xl font-bold text-neutral-900 mb-6">Nuevo comercio</h1>

      <CreateStoreForm />
    </div>
  );
}
