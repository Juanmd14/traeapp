import { supabaseAdmin } from "@/lib/supabase/admin";

export async function createNotification(params: {
  userId: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}) {
  await (supabaseAdmin.from("notifications") as any).insert({
    user_id: params.userId,
    channel: "in_app",
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? null,
    sent_at: new Date().toISOString(),
  });
}
