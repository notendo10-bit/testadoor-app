'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function CreatePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#9e8c7a' }}>読み込み中...</div>}>
      <CreateContent />
    </Suspense>
  )
}

function CreateContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [paid, setPaid] = useState(false)
  const [verifying, setVerifying] = useState(!!sessionId)
  const [paymentError, setPaymentError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
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
    green: '#2da894',
  }

  const inputStyle = {
    width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 10,
    padding: '11px 13px', fontSize: 14, color: C.text, background: C.bg,
    outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: 'inherit',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: C.textMid, marginBottom: 5, display: 'block',
  }

  // 支払い確認
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/verify-checkout?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.paid) {
          setPaid(true)
        } else {
          setPaymentError('支払いが確認できませんでした。もう一度お試しください。')
        }
      })
      .catch(() => setPaymentError('エラーが発生しました。'))
      .finally(() => setVerifying(false))
  }, [sessionId])

  // Stripe決済へ
  async function handleCheckout() {
    setCheckoutLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setCheckoutLoading(false)
    }
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

        {/* 支払い確認中 */}
        {verifying && (
          <div style={{ textAlign: 'center', padding: 60, color: C.textMid }}>
            支払いを確認中です...
          </div>
        )}

        {/* 作成完了 */}
        {!verifying && done && (
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
        )}

        {/* 決済前 */}
        {!verifying && !paid && !done && (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>ルームを作る</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.75, marginBottom: 24 }}>
              Google Playのテスターを12人集めます。<br />
              100円で1ルーム作成できます。
            </div>

            <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: C.textMid, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: C.text }}>🚪 テスタドアの仕組み</div>
              支援者がGmailを登録 → 12人集まったらメールで通知 → 1週間限定でメアドリストを公開
            </div>

            {paymentError && (
              <div style={{ background: '#fff0f0', border: '1px solid #e57373', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#c0392b', marginBottom: 16 }}>
                {paymentError}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{ width: '100%', padding: 14, background: C.accentGrad, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: checkoutLoading ? 'not-allowed' : 'pointer' }}>
              {checkoutLoading ? '移動中...' : '100円で申し込む →'}
            </button>
            <div style={{ marginTop: 10, fontSize: 11, color: C.textLight, textAlign: 'center' }}>
              Stripeの安全な決済画面に移動します
            </div>
          </div>
        )}

        {/* 決済後：アプリ情報入力 */}
        {!verifying && paid && !done && (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24 }}>
            <div style={{ background: '#f0faf6', border: '1.5px solid #2da894', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#1a6b5a', fontWeight: 600 }}>
              ✅ 支払いが確認できました
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
