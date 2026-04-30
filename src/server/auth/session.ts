import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole =
  | "customer"
  | "store_owner"
  | "store_staff"
  | "delivery_driver"
  | "admin";

export type SessionProfile = {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  phone: string | null;
};

/**
 * Devuelve el usuario autenticado o null.
 * Para usar en Server Components / Layouts que toleran usuario anónimo.
 */
export async function getSession(): Promise<SessionProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, phone")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as UserRole,
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
  };
}

/**
 * Requiere usuario autenticado. Redirige a /login si no lo está.
 * Usar en layouts/pages protegidas.
 */
export async function requireAuth(redirectTo = "/login"): Promise<SessionProfile> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

/**
 * Requiere rol específico. Redirige a / si no cumple.
 */
export async function requireRole(
  allowed: UserRole | UserRole[],
  redirectTo = "/",
): Promise<SessionProfile> {
  const session = await requireAuth();
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];

  // admin pasa siempre
  if (session.role === "admin") return session;

  if (!allowedArr.includes(session.role)) {
    redirect(redirectTo);
  }
  return session;
}

/**
 * Devuelve los store_id de los que el usuario es miembro.
 */
export async function getUserStores(userId: string): Promise<
  Array<{ storeId: string; role: "owner" | "manager" | "staff" }>
> {
  const supabase = createClient();
  const { data } = await supabase
    .from("store_users")
    .select("store_id, role")
    .eq("user_id", userId)
    .eq("is_active", true);

  return (data ?? []).map((r) => ({
    storeId: r.store_id,
    role: r.role as "owner" | "manager" | "staff",
  }));
}
