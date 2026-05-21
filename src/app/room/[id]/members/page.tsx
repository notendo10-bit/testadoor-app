'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const COLORS = {
  accent: '#e8793a',
  green: '#2da894',
  bg: '#faf7f2',
  text: '#2d2417',
  border: '#e0d9d0',
  muted: '#888',
}

type RoomData = {
  app_name: string
  expires_at: string | null
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#9e8c7a' }}>読み込み中...</div>}>
      <MembersContent />
    </Suspense>
  )
}

function MembersContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [emails, setEmails] = useState<string[]>([])
  const [room, setRoom] = useState<RoomData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('アクセストークンがありません。')
      setLoading(false)
      return
    }
    fetch(`/api/members?room_id=${id}&token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setEmails(data.emails)
          setRoom(data.room)
        }
      })
      .catch(() => setError('読み込みに失敗しました。'))
      .finally(() => setLoading(false))
  }, [id, token])

  function handleCopy() {
    navigator.clipboard.writeText(emails.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const expiryText = room?.expires_at
    ? new Date(room.expires_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const isExpired = room?.expires_at ? new Date(room.expires_at) < new Date() : false

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text }}>
      {/* ヘッダー */}
      <header
        style={{
          borderBottom: `1px solid ${COLORS.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '18px', color: COLORS.accent }}>テスタドア</span>
        <span style={{ color: COLORS.muted, fontSize: '13px' }}>テスターリスト</span>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px' }}>
        {loading && <p style={{ color: COLORS.muted }}>読み込み中...</p>}

        {error && (
          <div
            style={{
              background: '#fff0eb',
              border: `1px solid ${COLORS.accent}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: COLORS.accent, fontWeight: 700, marginBottom: '8px' }}>
              アクセスできません
            </p>
            <p style={{ color: COLORS.text, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {!loading && !error && room && (
          <>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
              {room.app_name}
            </h1>
            <p style={{ color: COLORS.green, fontSize: '14px', marginBottom: '24px' }}>
              テスター {emails.length} 人のGmailアドレス
            </p>

            {isExpired && (
              <div
                style={{
                  background: '#fff0eb',
                  border: `1px solid ${COLORS.accent}`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: COLORS.accent,
                }}
              >
                このリストの公開期限は終了しています。
              </div>
            )}

            {expiryText && !isExpired && (
              <p style={{ fontSize: '13px', color: COLORS.muted, marginBottom: '16px' }}>
                公開期限：{expiryText} まで
              </p>
            )}

            {/* コピーボタン */}
            <button
              onClick={handleCopy}
              style={{
                display: 'block',
                width: '100%',
                background: copied ? COLORS.green : COLORS.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'background 0.2s',
              }}
            >
              {copied ? '✓ コピーしました' : '12件まとめてコピー'}
            </button>

            {/* メアドリスト */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {emails.map((email, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      i < emails.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      background: COLORS.green,
                      color: '#fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{email}</span>
                </div>
              ))}
            </div>

            <p style={{ marginTop: '24px', fontSize: '13px', color: COLORS.muted }}>
              Google Play Console → テスト → 内部テスト → テスター追加 でこのリストを貼り付けてください。
            </p>
          </>
        )}
      </main>
    </div>
  )
}
