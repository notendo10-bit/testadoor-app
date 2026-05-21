import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const room_id = searchParams.get('room_id')
  const token = searchParams.get('token')

  if (!room_id || !token) {
    return NextResponse.json({ error: 'パラメータが不足しています。' }, { status: 400 })
  }

  // トークンがこのルームの登録に紐づいているか確認
  const { data: tokenMatch } = await supabase
    .from('registrations')
    .select('id')
    .eq('room_id', room_id)
    .eq('token', token)
    .single()

  if (!tokenMatch) {
    return NextResponse.json(
      { error: 'トークンが無効です。メールに記載のリンクからアクセスしてください。' },
      { status: 403 }
    )
  }

  // ルーム情報取得
  const { data: room } = await supabase
    .from('rooms')
    .select('app_name, expires_at, status')
    .eq('id', room_id)
    .single()

  if (!room) {
    return NextResponse.json({ error: 'ルームが見つかりません。' }, { status: 404 })
  }

  if (room.status !== 'closed') {
    return NextResponse.json(
      { error: 'まだ12人に達していません。達成後に公開されます。' },
      { status: 403 }
    )
  }

  if (room.expires_at && new Date(room.expires_at) < new Date()) {
    return NextResponse.json(
      { error: '公開期限が終了しました。メアドリストは削除されています。' },
      { status: 410 }
    )
  }

  // メアドリスト取得
  const { data: regs } = await supabase
    .from('registrations')
    .select('email')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true })

  const emails = regs?.map((r) => r.email) ?? []

  return NextResponse.json({ emails, room: { app_name: room.app_name, expires_at: room.expires_at } })
}
