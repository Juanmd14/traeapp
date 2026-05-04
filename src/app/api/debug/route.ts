import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const [anonResult, adminResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, store_id, is_active')
      .eq('store_id', '11111111-1111-1111-1111-111111111111'),

    (supabaseAdmin as any)
      .from('products')
      .select('id, name, store_id, is_active')
      .eq('store_id', '11111111-1111-1111-1111-111111111111'),
  ])

  return NextResponse.json({
    anon: { count: anonResult.data?.length ?? 0, error: anonResult.error?.message },
    admin: { count: adminResult.data?.length ?? 0, error: adminResult.error?.message },
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  })
}
