import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/shared/login-form";
import { getSession } from "@/server/auth/session";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getSession();
  if (session) redirect(searchParams.next ?? "/");

  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-body-sm text-neutral-500 text-center">
        ¿No tenés cuenta?{" "}
        <Link
          href="/registro"
          className="text-primary-600 font-medium hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}