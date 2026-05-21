import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { app_name, description, store_url, owner_email, ref } = body

  // ref検証
  const { data: refData, error: refError } = await supabase
    .from('create_refs')
    .select('*')
    .eq('ref', ref)
    .single()

  if (refError || !refData) {
    return NextResponse.json({ error: 'Invalid ref' }, { status: 400 })
  }
  if (refData.used) {
    return NextResponse.json({ error: 'Ref already used' }, { status: 400 })
  }
  if (new Date(refData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ref expired' }, { status: 400 })
  }

  // ルーム作成
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ app_name, description, store_url, owner_email })
    .select()
    .single()

  if (roomError) return NextResponse.json({ error: roomError }, { status: 500 })

  // ref使用済みに
  await supabase
    .from('create_refs')
    .update({ used: true, owner_email })
    .eq('ref', ref)

  return NextResponse.json(room)
}