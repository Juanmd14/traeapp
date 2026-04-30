import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/shared/login-form";
import { getSession } from "@/server/auth/session";

export const metadata = { title: "Crear cuenta" };

export default async function RegistroPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-body-sm text-neutral-500 text-center">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
