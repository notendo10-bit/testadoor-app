// Supabase Edge Function: close-expired-rooms
// cronスケジュール: 毎日 0:00 UTC ("0 0 * * *")
// Supabase Dashboard → Edge Functions → Schedules で設定してください

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 期限切れの open/closed ルームを取得
  const { data: expiredRooms, error } = await supabase
    .from('rooms')
    .select('id')
    .lt('expires_at', new Date().toISOString())
    .neq('status', 'deleted')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const ids = expiredRooms?.map((r) => r.id) ?? []

  if (ids.length === 0) {
    return new Response(JSON.stringify({ closed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // registrations のメアドを削除
  await supabase
    .from('registrations')
    .delete()
    .in('room_id', ids)

  // ルームを deleted に変更
  await supabase
    .from('rooms')
    .update({ status: 'deleted' })
    .in('id', ids)

  return new Response(
    JSON.stringify({ closed: ids.length, room_ids: ids }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
