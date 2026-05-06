import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { productId, imageBase64 } = await req.json();

    if (!productId || !imageBase64) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Obtener store_id del producto
    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("store_id")
      .eq("id", productId)
      .single();

    if (productErr || !product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const storeId = (product as { store_id: string }).store_id;

    // Verificar membresía
    const { data: membership } = await supabase
      .from("store_users")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No tenés permiso sobre este producto" }, { status: 403 });
    }

    // Parsear base64
    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Formato de imagen inválido" }, { status: 400 });
    }

    const [, mimeType, base64] = match;
    const ext = (mimeType ?? "image/jpeg").split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const buffer = Buffer.from(base64 ?? "", "base64");

    if (buffer.byteLength > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen es muy grande (máx 2MB)" }, { status: 400 });
    }

    const bucket = "product-images";
    const path = `${storeId}/${productId}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    const url = `${publicUrl.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabaseAdmin
      .from("products")
      .update({ image_url: url })
      .eq("id", productId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}