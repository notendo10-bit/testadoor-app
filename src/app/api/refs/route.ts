import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ref検証
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  if (!ref) return NextResponse.json({ valid: false })

  const { data } = await supabase
    .from('create_refs')
    .select('*')
    .eq('ref', ref)
    .single()

  if (!data) return NextResponse.json({ valid: false })
  if (data.used) return NextResponse.json({ valid: false, reason: 'used' })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: 'expired' })

  return NextResponse.json({ valid: true })
}

// ref発行（管理者用）
export async function POST(req: Request) {
  const body = await req.json()
  const { secret } = body

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ref = crypto.randomUUID()
  await supabase.from('create_refs').insert({ ref })

  return NextResponse.json({ ref })
}