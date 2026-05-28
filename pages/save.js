import { useState } from 'react'

export default function Save() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!input.trim()) return
    setLoading(true)
    setStatus(null)
    try {
      const parsed = JSON.parse(input.trim())
      // Send as-is — API handles both single objects and arrays
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      const result = await res.json()
      if (result.success) {
        const count = result.count || 1
        setStatus({ type: 'ok', msg: `✓ Saved ${count} ${count === 1 ? 'entry' : 'entries'} successfully!` })
        setInput('')
      } else {
        setStatus({ type: 'err', msg: result.error || 'Save failed' })
      }
    } catch (e) {
      setStatus({ type: 'err', msg: 'Invalid JSON — paste the exact data from Claude' })
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <a href="/" style={{ background: '#f0f0f0', border: '1px solid #eee', borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#555', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Iron<span style={{ color: '#e85c00' }}>Log</span> <span style={{ fontSize: 14, color: '#aaa', fontWeight: 500 }}>/ Save</span></div>
      </div>
      <div style={{ background: '#fff4ee', border: '1px solid #fbd0b0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e85c00', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>HOW TO USE</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
          1. Type <strong>FINAL LOG</strong> in Claude chat<br />
          2. Copy the JSON block<br />
          3. Paste below and tap Save<br />
          <strong>Supports single entries and batch uploads</strong>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>PASTE LOG DATA</div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'Single: { "date": "2026-05-27", ... }\n\nBatch: [{ "date": "..." }, { "date": "..." }]'}
          style={{ width: '100%', minHeight: 200, background: '#f9f9f9', border: '1px solid #eee', borderRadius: 10, padding: '11px 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: 1.6, color: '#111' }}
        />
        <button
          onClick={handleSave}
          disabled={loading || !input.trim()}
          style={{ width: '100%', marginTop: 10, background: '#e85c00', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, padding: 14, cursor: 'pointer', opacity: loading || !input.trim() ? .4 : 1 }}
        >
          {loading ? 'Saving...' : 'Save to Dashboard →'}
        </button>
      </div>
      {status && (
        <div style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 500, background: status.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: status.type === 'ok' ? '#166534' : '#991b1b', border: `1px solid ${status.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
          {status.msg}
        </div>
      )}
    </div>
  )
}
