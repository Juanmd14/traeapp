import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

export async function getSession(): Promise<SessionProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await (supabase.from("profiles") as any)
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

export async function requireAuth(redirectTo = "/login"): Promise<SessionProfile> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

export async function requireRole(
  allowed: UserRole | UserRole[],
  redirectTo = "/",
): Promise<SessionProfile> {
  const session = await requireAuth();
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];

  if (session.role === "admin") return session;

  if (!allowedArr.includes(session.role)) {
    redirect(redirectTo);
  }
  return session;
}

export async function getUserStores(userId: string): Promise<Array<{ storeId: string; role: "owner" | "manager" | "staff" }>> {
  const supabase = createClient();
  const { data } = await (supabase.from("store_users") as any)
    .select("store_id, role")
    .eq("user_id", userId)
    .eq("is_active", true);

  return (data ?? []).map((r: any) => ({
    storeId: r.store_id,
    role: r.role as "owner" | "manager" | "staff",
  }));
}

export type StoreWithName = {
  storeId: string;
  role: "owner" | "manager" | "staff";
  name: string;
};

export async function getUserStoresWithNames(userId: string): Promise<StoreWithName[]> {
  const supabase = createClient();
  const { data } = await (supabase.from("store_users") as any)
    .select("store_id, role, stores(name)")
    .eq("user_id", userId)
    .eq("is_active", true);

  return (data ?? []).map((r: any) => ({
    storeId: r.store_id,
    role: r.role as "owner" | "manager" | "staff",
    name: r.stores?.name ?? "Sin nombre",
  }));
}

/** Devuelve el storeId activo leyendo la cookie; cae al primero si no hay cookie válida. */
export function getActiveStoreId(stores: Array<{ storeId: string }>): string | null {
  if (stores.length === 0) return null;
  const cookieStore = cookies();
  const savedId = (cookieStore as any).get("active_store_id")?.value as string | undefined;
  if (savedId && stores.some((s) => s.storeId === savedId)) {
    return savedId;
  }
  return stores[0]?.storeId ?? null;
}