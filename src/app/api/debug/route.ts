import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  if (!slug) {
    return NextResponse.json({ error: 'Pasá ?slug=el-slug-del-local' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: store } = await (supabaseAdmin as any)
    .from('stores')
    .select('id, name, status, deleted_at')
    .eq('slug', slug)
    .single()

  if (!store) {
    return NextResponse.json({ error: 'Store no encontrado con ese slug' }, { status: 404 })
  }

  const storeId = store.id

  const [anonProducts, adminProducts, anonCategories] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, is_active, deleted_at, product_category_id')
      .eq('store_id', storeId),

    (supabaseAdmin as any)
      .from('products')
      .select('id, name, is_active, deleted_at, product_category_id')
      .eq('store_id', storeId),

    supabase
      .from('product_categories')
      .select('id, name')
      .eq('store_id', storeId),
  ])

  return NextResponse.json({
    store: { id: storeId, name: store.name, status: store.status, deleted_at: store.deleted_at },
    anon: {
      products: { count: anonProducts.data?.length ?? 0, error: anonProducts.error?.message, items: anonProducts.data },
      categories: { count: anonCategories.data?.length ?? 0, error: anonCategories.error?.message },
    },
    admin: {
      products: { count: adminProducts.data?.length ?? 0, error: adminProducts.error?.message, items: adminProducts.data },
    },
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  })
}
