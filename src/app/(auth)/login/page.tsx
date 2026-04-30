import { redirect } from "next/navigation";
import { LoginForm } from "@/components/shared/login-form";
import { getSession } from "@/server/auth/session";

export const metadata = { title: "Ingresar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Si ya hay sesión, redirigimos
  const session = await getSession();
  if (session) {
    redirect(searchParams.next ?? "/");
  }

  return <LoginForm />;
}
