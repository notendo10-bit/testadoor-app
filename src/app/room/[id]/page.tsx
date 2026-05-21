'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Room = {
  id: string
  app_name: string
  description: string
  store_url: string
  status: string
  expires_at: string
}

export default function RoomPage() {
  const { id } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [count, setCount] = useState(0)
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const C = {
    bg: '#faf7f2', white: '#fff', border: '#e8e0d0', text: '#2d2417',
    textMid: '#7a6a5a', textLight: '#9e8c7a', accent: '#e8793a',
    accentGrad: 'linear-gradient(135deg, #f0a070 0%, #e8793a 100%)',
    green: '#2da894',
  }

  useEffect(() => {
    fetchRoom()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchRoom() {
    const { data } = await supabase.from('rooms').select('*').eq('id', id).single()
    if (data) setRoom(data)
    const { count: c } = await supabase
      .from('registrations').select('*', { count: 'exact' }).eq('room_id', id)
    setCount(c || 0)
    setLoading(false)
  }

  async function handleSupport() {
    if (!email || !agreed) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: id, email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error === 'Already registered' ? 'このメアドはすでに登録済みです' : 'エラーが発生しました')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
    fetchRoom()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#9e8c7a' }}>読み込み中...</div>
  if (!room) return <div style={{ textAlign: 'center', padding: 80 }}>ルームが見つかりません</div>

  const pct = Math.round((count / 12) * 100)
  const full = count >= 12

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ background: C.white, borderBottom: `2px solid ${C.border}`, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 34, height: 34, background: C.accentGrad, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚪</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>テスタドア</div>
            <div style={{ fontSize: 9, color: C.textLight }}>コミュ障開発者支援</div>
          </div>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: C.textMid, textDecoration: 'none' }}>← 一覧に戻る</Link>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 60px' }}>
        {done ? (
          <div style={{ background: '#f0faf6', border: '1.5px solid #2da894', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🙌</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a6b5a', marginBottom: 10 }}>支援ありがとうございます！</div>
            <div style={{ fontSize: 13, color: '#2d8a7a', lineHeight: 1.8 }}>
              登録完了メールをお送りしました。<br />
              12人集まり次第、メールでお知らせします。<br />
              メアドリストは<strong>1週間限定</strong>で公開されます。
            </div>
            <Link href="/" style={{ display: 'block', marginTop: 20, padding: '12px', background: C.accentGrad, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              一覧に戻る
            </Link>
          </div>
        ) : (
          <>
            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{room.app_name}</div>
                <div style={{ background: full ? '#f0ebe4' : '#fff3ec', color: full ? C.textLight : C.accent, border: `1px solid ${full ? C.border : '#f0c4a0'}`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700 }}>
                  {full ? '満員' : '募集中'}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 16 }}>{room.description}</div>
              <a href={room.store_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.green, textDecoration: 'none' }}>
                🔗 Google Playで見る
              </a>
            </div>

            <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
              <div style={{ height: 10, background: '#f0ebe4', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: full ? '#a0a090' : C.accentGrad, borderRadius: 5, transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.textLight, marginBottom: 4 }}>
                <span>{count} / 12 人が支援済み</span>
                <span>残り <strong style={{ color: full ? C.textLight : C.accent }}>{Math.max(0, 12 - count)}</strong> 人</span>
              </div>
            </div>

            {!full && (
              <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>このアプリを支援する 🚪</div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 5, display: 'block' }}>
                  あなたのGmailアドレス
                </label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 13px', fontSize: 14, background: C.bg, outline: 'none', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setAgreed(!agreed)}>
                  <input type="checkbox" checked={agreed} readOnly style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, accentColor: C.accent }} />
                  <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>
                    このGmailはGoogle Playのテストユーザー登録目的で提供します。<strong> 他の支援者には公開されません。</strong>
                  </div>
                </div>
                {error && (
                  <div style={{ background: '#fff0f0', border: '1px solid #e57373', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#c0392b', marginBottom: 12 }}>
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSupport}
                  disabled={submitting || !email || !agreed}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: (!email || !agreed) ? '#d0c8be' : C.accentGrad,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: (!email || !agreed) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {submitting ? '送信中...' : '支援する 🚪'}
                </button>
              </div>
            )}

            {full && (
              <div style={{ background: '#f5f5f0', borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, textAlign: 'center', color: C.textMid, fontSize: 14 }}>
                このルームは満員です。ご支援ありがとうございました。
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
