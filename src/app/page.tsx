'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Room = {
  id: string
  app_name: string
  description: string
  store_url: string
  status: string
  created_at: string
  expires_at: string
  count?: number
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
  }, [])

  async function fetchRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setRooms(data)

    // 各ルームの登録人数取得
    if (data) {
      const countMap: Record<string, number> = {}
      for (const room of data) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact' })
          .eq('room_id', room.id)
        countMap[room.id] = count || 0
      }
      setCounts(countMap)
    }
    setLoading(false)
  }

  const openRooms = rooms.filter(r => r.status === 'open')
  const closedRooms = rooms.filter(r => r.status === 'closed')

  const C = {
    bg: '#faf7f2', white: '#fff', border: '#e8e0d0', text: '#2d2417',
    textMid: '#7a6a5a', textLight: '#9e8c7a', accent: '#e8793a',
    accentGrad: 'linear-gradient(135deg, #f0a070 0%, #e8793a 100%)',
    green: '#2da894', greenGrad: 'linear-gradient(135deg, #41c9b0 0%, #2da894 100%)',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ background: C.white, borderBottom: `2px solid ${C.border}`, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.accentGrad, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚪</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>テスタドア</div>
            <div style={{ fontSize: 9, color: C.textLight }}>コミュ障開発者支援</div>
          </div>
        </div>
        <a href="https://note.com" target="_blank" rel="noreferrer" style={{ background: C.greenGrad, color: '#fff', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
          登録はこちら（note）
        </a>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#fff8f0,#fef3e8)', borderBottom: `1px solid ${C.border}`, padding: '36px 20px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, lineHeight: 1.35 }}>
          あなたの支援が<br /><span style={{ color: C.accent }}>ドアを開ける</span>
        </div>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.85, maxWidth: 320, margin: '0 auto 20px' }}>
          個人開発者のGoogle Playテスター集めを<br />みんなで支援するプラットフォーム。<br />Gmailを登録するだけ、無料で参加できます。
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['アプリを選ぶ', 'Gmailを登録', '12人で完成！', 'テスト開始'].map((s, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, color: C.textMid, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ background: C.accent, color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{i + 1}</div>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, background: C.white, padding: '0 16px' }}>
        {[['open', `募集中 (${openRooms.length})`], ['closed', `実績 (${closedRooms.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as 'open' | 'closed')}
            style={{ padding: '13px 16px', border: 'none', borderBottom: tab === key ? `3px solid ${C.accent}` : '3px solid transparent', background: 'none', fontSize: 13, fontWeight: tab === key ? 800 : 500, color: tab === key ? C.accent : C.textLight, cursor: 'pointer', marginBottom: -2 }}>
            {label}
          </button>
        ))}
        <Link href="/create" style={{ marginLeft: 'auto', padding: '13px 0', fontSize: 13, fontWeight: 700, color: C.green, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          ＋ ルームを作る
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 60px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>読み込み中...</div>}

        {/* 募集中 */}
        {tab === 'open' && !loading && (
          <>
            {openRooms.length === 0 && <div style={{ textAlign: 'center', color: C.textLight, padding: 48 }}>現在募集中のアプリはありません</div>}
            {openRooms.map(room => {
              const count = counts[room.id] || 0
              const pct = Math.round((count / 12) * 100)
              return (
                <Link key={room.id} href={`/room/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, marginBottom: 14, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{room.app_name}</div>
                      <div style={{ background: '#fff3ec', color: C.accent, border: `1px solid #f0c4a0`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700 }}>募集中</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, marginBottom: 12 }}>{room.description}</div>
                    <div style={{ height: 7, background: '#f0ebe4', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: C.accentGrad, borderRadius: 4, transition: 'width 0.6s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textLight }}>
                      <span>{count} / 12 人</span>
                      <span>残り <strong style={{ color: C.accent }}>{12 - count}</strong> 人</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </>
        )}

        {/* 実績 */}
        {tab === 'closed' && !loading && (
          <>
            {closedRooms.length === 0 && <div style={{ textAlign: 'center', color: C.textLight, padding: 48 }}>まだ完了したアプリはありません</div>}
            {closedRooms.map(room => (
              <div key={room.id} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '13px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>✅ {room.app_name}</div>
                  <div style={{ fontSize: 11, color: '#b0a090', marginTop: 2 }}>{room.created_at.slice(0, 10)} 完了</div>
                </div>
                <div style={{ fontSize: 22 }}>🎉</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}