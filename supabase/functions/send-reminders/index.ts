// Supabase Edge Function: send-reminders
// cronスケジュール: 毎日 9:00 JST = 0:00 UTC ("0 0 * * *")
// Supabase Dashboard → Edge Functions → Schedules で設定してください
//
// 達成から3日後（expires_at の4日前）に開発者へリマインドメールを送信

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FROM = 'テスタドア <noreply@testadoor.com>'
const BASE_URL = Deno.env.get('NEXT_PUBLIC_BASE_URL') ?? 'https://testadoor.vercel.app'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 4日後に期限切れになる closed ルームを取得（= 達成から3日後）
  const now = new Date()
  const in4days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, app_name, owner_email, expires_at')
    .eq('status', 'closed')
    .gt('expires_at', in3days.toISOString())
    .lte('expires_at', in4days.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ skipped: 'no RESEND_API_KEY' }))
  }

  let sent = 0
  for (const room of rooms ?? []) {
    // owner のトークンを1件取得してリンク生成
    const { data: reg } = await supabase
      .from('registrations')
      .select('token')
      .eq('room_id', room.id)
      .limit(1)
      .single()

    if (!reg?.token) continue

    const url = `${BASE_URL}/room/${room.id}/members?token=${reg.token}`
    const expiryText = new Date(room.expires_at).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: room.owner_email,
        subject: `【テスタドア】「${room.app_name}」のメアドリスト、あと4日で削除されます`,
        html: reminderHtml(room.app_name, url, expiryText),
      }),
    })

    sent++
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function reminderHtml(appName: string, url: string, expiryText: string): string {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf7f2;color:#2d2417;">
  <h2 style="color:#e8793a;">テスタドア</h2>
  <p>「<strong>${appName}</strong>」のテスターメアドリストの公開期限が近づいています。</p>
  <p><strong>${expiryText}</strong> までにアクセスしてください。期限後はリストが自動削除されます。</p>
  <p style="margin-top:24px;">
    <a href="${url}" style="display:inline-block;background:#e8793a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">メアドリストを見る</a>
  </p>
  <hr style="border:none;border-top:1px solid #e0d9d0;margin:32px 0;">
  <p style="font-size:12px;color:#888;">テスタドア — コミュ障開発者支援サービス</p>
</div>`
}
