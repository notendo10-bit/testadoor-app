'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'

export default function CreatePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#9e8c7a' }}>読み込み中...</div>}>
      <CreateContent />
    </Suspense>
  )
}

function CreateContent() {
  const [password, setPassword] = useState('')
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordChecking, setPasswordChecking] = useState(false)
  const [form, setForm] = useState({
    ownerEmail: '',
    appName: '',
    description: '',
    storeUrl: '',
    pledge1: false,
    pledge2: false,
    pledge3: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const C = {
    bg: '#faf7f2', white: '#fff', border: '#e8e0d0', text: '#2d2417',
    textMid: '#7a6a5a', textLight: '#9e8c7a', accent: '#e8793a',
    accentGrad: 'linear-gradient(135deg, #f0a070 0%, #e8793a 100%)',
    green: '#2da894', greenGrad: 'linear-gradient(135deg, #41c9b0 0%, #2da894 100%)',
  }

  const inputStyle = {
    width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10,
    padding: '11px 13px', fontSize: 14, color: C.text, background: C.bg,
    outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: 'inherit',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 5, display: 'block',
  }

  async function checkPassword() {
    setPasswordChecking(true)
    setPasswordError('')
    const res = await fetch('/api/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setPasswordValid(true)
    } else {
      setPasswordError('合言葉が正しくありません')
    }
    setPasswordChecking(false)
  }

  async function handleCreate() {
    const { ownerEmail, appName, description, storeUrl, pledge1, pledge2, pledge3 } = form
    if (!ownerEmail || !appName || !description || !storeUrl || !pledge1 || !pledge2 || !pledge3) {
      setError('すべての項目を入力・同意してください')
      return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_name: appName,
        description,
        store_url: storeUrl,
        owner_email: ownerEmail,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'エラーが発生しました')
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

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
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a6b5a', marginBottom: 10 }}>ルームを作成しました！</div>
            <div style={{ fontSize: 13, color: '#2d8a7a', lineHeight: 1.8, marginBottom: 20 }}>
              Xで自動拡散します。<br />
              12人集まったらメールでお知らせします。<br />
              メアドリストは<strong>1週間限定</strong>で公開されます。
            </div>
            <Link href="/" style={{ display: 'block', padding: '13px', background: C.accentGrad, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              一覧ページを見る 🚪
            </Link>
          </div>

        ) : !passwordValid ? (
          /* STEP1: 合言葉入力 */
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>ルームを作る</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.75, marginBottom: 20 }}>
              テスタドアでアプリのテスターを集めませんか？<br />
              noteの登録記事（100円）を購入すると、合言葉が記載されています。
            </div>
            <a href="https://note.com" target="_blank" rel="noreferrer"
              style={{ display: 'block', background: C.greenGrad, color: '#fff', borderRadius: 12, padding: 14, textAlign: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}>
              noteで購入する（100円）→
            </a>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <label style={labelStyle}>購入後、記事内の合言葉を入力</label>
              <input
                style={inputStyle}
                type="password"
                placeholder="合言葉"
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError('') }}
                onKeyDown={e => e.key === 'Enter' && checkPassword()}
              />
              {passwordError && (
                <div style={{ background: '#fff0f0', border: '1px solid #e57373', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#c0392b', marginBottom: 12 }}>
                  {passwordError}
                </div>
              )}
              <button
                onClick={checkPassword}
                disabled={!password || passwordChecking}
                style={{ width: '100%', padding: 13, background: (!password || passwordChecking) ? '#e8e0d0' : C.accentGrad, color: (!password || passwordChecking) ? '#a09890' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: (!password || passwordChecking) ? 'not-allowed' : 'pointer' }}>
                {passwordChecking ? '確認中...' : '確認する'}
              </button>
            </div>
          </div>

        ) : (
          /* STEP2: アプリ情報入力 */
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ background: '#f0faf6', border: '1.5px solid #2da894', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#1a6b5a', fontWeight: 600 }}>
              ✅ 認証できました
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>アプリ情報を入力</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.75, marginBottom: 20 }}>
              集まったGmailはGoogle Playのテストユーザー登録のみに使用してください。
            </div>

            <label style={labelStyle}>通知用メールアドレス *</label>
            <input style={inputStyle} type="email" placeholder="your@email.com"
              value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} />

            <label style={labelStyle}>アプリ名 *</label>
            <input style={inputStyle} placeholder="例：ポモドーロ侍"
              value={form.appName} onChange={e => setForm({ ...form, appName: e.target.value })} />

            <label style={labelStyle}>アプリの説明 *</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 } as React.CSSProperties}
              placeholder="どんなアプリか、2〜3文で説明してください"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <label style={labelStyle}>Google Play ストアURL *</label>
            <input style={inputStyle} placeholder="https://play.google.com/store/apps/..."
              value={form.storeUrl} onChange={e => setForm({ ...form, storeUrl: e.target.value })} />

            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 16, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 12 }}>誓約事項（必須）</div>
              {[
                { key: 'pledge1', text: '集めたGmailアドレスをGoogle Playのテストユーザー登録以外の目的に使用しません' },
                { key: 'pledge2', text: '第三者への提供・転売・営業目的での使用は一切しません' },
                { key: 'pledge3', text: '登録されたGmailはこのアプリ1本のみに使用し、他のアプリへの流用はしません' },
              ].map(({ key, text }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}>
                  <input type="checkbox" checked={form[key as keyof typeof form] as boolean} readOnly
                    style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, accentColor: C.accent }} />
                  <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{text}</div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #e57373', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#c0392b', marginBottom: 12 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={submitting || !(form.ownerEmail && form.appName && form.description && form.storeUrl && form.pledge1 && form.pledge2 && form.pledge3)}
              style={{ width: '100%', padding: 13, background: (submitting || !(form.ownerEmail && form.appName && form.description && form.storeUrl && form.pledge1 && form.pledge2 && form.pledge3)) ? '#e8e0d0' : C.accentGrad, color: (submitting || !(form.ownerEmail && form.appName && form.description && form.storeUrl && form.pledge1 && form.pledge2 && form.pledge3)) ? '#a09890' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? '作成中...' : 'ルームを作成する 🚪'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
