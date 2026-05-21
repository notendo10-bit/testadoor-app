import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'テスタドア <onboarding@resend.dev>'
// VERCEL_URL は Vercel が自動で設定する（https:// なし）
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export async function POST(req: Request) {
  const body = await req.json()
  const { room_id, email } = body

  // ルーム確認
  const { data: room } = await supabase
    .from('rooms')
    .select('*, registrations(count)')
    .eq('id', room_id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.status === 'closed') return NextResponse.json({ error: 'Room closed' }, { status: 400 })

  // 重複チェック
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('room_id', room_id)
    .eq('email', email)
    .single()

  if (existing) return NextResponse.json({ error: 'Already registered' }, { status: 400 })

  // 登録
  const { data: reg } = await supabase
    .from('registrations')
    .insert({ room_id, email })
    .select()
    .single()

  // 支援完了メール（支援者へ）
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `【テスタドア】「${room.app_name}」への支援を受け付けました`,
      html: supporterConfirmHtml(room.app_name, room.store_url),
    }).catch(() => {}) // メール失敗は無視して登録は成功させる
  }

  // 人数確認
  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact' })
    .eq('room_id', room_id)

  // 12人達成でクローズ
  if (count && count >= 12) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase
      .from('rooms')
      .update({ status: 'closed', expires_at: expiresAt })
      .eq('id', room_id)

    if (process.env.RESEND_API_KEY) {
      // 全支援者のメアドを取得
      const { data: allRegs } = await supabase
        .from('registrations')
        .select('email, token')
        .eq('room_id', room_id)

      const allEmails = allRegs?.map((r) => r.email) ?? []
      const ownerToken = reg?.token ?? allRegs?.[0]?.token ?? ''

      // 開発者へ達成メール
      await resend.emails.send({
        from: FROM,
        to: room.owner_email,
        subject: `【テスタドア】「${room.app_name}」が12人達成しました！`,
        html: ownerAchievedHtml(room.app_name, room_id, ownerToken, expiresAt, BASE_URL),
      }).catch(() => {})

      // 支援者全員へ達成メール
      for (const reg of allRegs ?? []) {
        await resend.emails.send({
          from: FROM,
          to: reg.email,
          subject: `【テスタドア】「${room.app_name}」のテスターが12人集まりました！`,
          html: supporterAchievedHtml(room.app_name, room.store_url),
        }).catch(() => {})
      }

      // リマインドメール（3日後）は Supabase Edge Function の cron で送信
      // supabase/functions/send-reminders/index.ts を参照
    }
  }

  return NextResponse.json({ success: true, token: reg?.token })
}

function supporterConfirmHtml(appName: string, storeUrl: string): string {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf7f2;color:#2d2417;">
  <h2 style="color:#e8793a;">テスタドア</h2>
  <p>「<strong>${appName}</strong>」へのテスター支援を受け付けました。</p>
  <p>12人のテスターが集まった際に、改めてご連絡します。</p>
  <p style="margin-top:24px;">
    <a href="${storeUrl}" style="color:#2da894;">Google Playページを見る</a>
  </p>
  <hr style="border:none;border-top:1px solid #e0d9d0;margin:32px 0;">
  <p style="font-size:12px;color:#888;">テスタドア — コミュ障開発者支援サービス</p>
</div>`
}

function ownerAchievedHtml(
  appName: string,
  roomId: string,
  token: string,
  expiresAt: string,
  baseUrl: string
): string {
  const url = `${baseUrl}/room/${roomId}/members?token=${token}`
  const expiry = new Date(expiresAt).toLocaleDateString('ja-JP')
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf7f2;color:#2d2417;">
  <h2 style="color:#e8793a;">テスタドア</h2>
  <p>「<strong>${appName}</strong>」のテスターが<strong>12人</strong>集まりました！</p>
  <p>以下のリンクから、テスターのGmailアドレス一覧を確認できます。</p>
  <p style="margin-top:24px;">
    <a href="${url}" style="display:inline-block;background:#e8793a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">メアドリストを見る</a>
  </p>
  <p style="color:#888;font-size:13px;">※ このリンクは ${expiry} まで有効です。期限後は自動削除されます。</p>
  <hr style="border:none;border-top:1px solid #e0d9d0;margin:32px 0;">
  <p style="font-size:12px;color:#888;">テスタドア — コミュ障開発者支援サービス</p>
</div>`
}

function supporterAchievedHtml(appName: string, storeUrl: string): string {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#faf7f2;color:#2d2417;">
  <h2 style="color:#e8793a;">テスタドア</h2>
  <p>「<strong>${appName}</strong>」のテスターが12人集まりました！</p>
  <p>開発者からのGoogle Playテスター招待をお待ちください。</p>
  <p style="margin-top:24px;">
    <a href="${storeUrl}" style="color:#2da894;">Google Playページを見る</a>
  </p>
  <hr style="border:none;border-top:1px solid #e0d9d0;margin:32px 0;">
  <p style="font-size:12px;color:#888;">テスタドア — コミュ障開発者支援サービス</p>
</div>`
}
