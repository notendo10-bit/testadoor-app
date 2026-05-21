import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

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
  const { app_name, description, store_url, owner_email } = body

  if (!app_name || !description || !store_url || !owner_email) {
    return NextResponse.json({ error: '入力が不足しています' }, { status: 400 })
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ app_name, description, store_url, owner_email })
    .select()
    .single()

  if (roomError) return NextResponse.json({ error: roomError }, { status: 500 })

  await postToX(app_name, description, store_url, room.id)

  return NextResponse.json(room)
}

async function postToX(appName: string, description: string, storeUrl: string, roomId: string) {
  if (
    !process.env.X_API_KEY ||
    !process.env.X_API_SECRET ||
    !process.env.X_ACCESS_TOKEN ||
    !process.env.X_ACCESS_TOKEN_SECRET
  ) return

  try {
    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
    })

    const roomUrl = `${BASE_URL}/room/${roomId}`
    const shortDesc = description.length > 40 ? description.slice(0, 40) + '…' : description
    const tweet = `【テスター募集】${appName}\n\n${shortDesc}\n\nGmailを登録するだけで支援できます👇\n${roomUrl}\n\n#テスタドア #個人開発 #Androidアプリ`

    await client.v2.tweet(tweet)
  } catch {
    // ツイート失敗はルーム作成に影響させない
  }
}
