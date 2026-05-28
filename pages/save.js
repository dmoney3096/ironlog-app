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
      const data = JSON.parse(input.trim())
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.success) {
        setStatus({ type: 'ok', msg: `✓ Saved! Date: ${data.date}` })
        setInput('')
      } else {
        setStatus({ type: 'err', msg: result.error || 'Save failed' })
      }
    } catch (e) {
      setStatus({ type: 'err', msg: 'Invalid format — paste the exact JSON from Claude' })
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#f4f4f4', minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <a href="/" style={{ background: '#f0f0f0', border: '1px solid #eee', borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#555', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Iron<span style={{ color: '#e85c00' }}>Log</span> <span style={{ fontSize: 14, color: '#aaa', fontWeight: 500 }}>/ Save</span></div>
      </div>

      {/* Instructions */}
      <div style={{ background: '#fff4ee', border: '1px solid #fbd0b0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e85c00', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>HOW TO USE</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
          1. Type <strong>FINAL LOG</strong> in Claude chat<br />
          2. Claude gives you a JSON block<br />
          3. Copy it<br />
          4. Paste it below and tap Save
        </div>
      </div>

      {/* Input */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>PASTE LOG DATA</div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'{\n  "date": "2026-05-26",\n  "weight": 156.8,\n  ...\n}'}
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

      {/* Quick test */}
      <div style={{ marginTop: 20, background: '#fff', borderRadius: 14, border: '1px solid #eee', padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>QUICK TEST</div>
        <button
          onClick={() => setInput(JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            weight: 156.8,
            weight_unit: 'lbs',
            workouts: [{ exercise: 'Test Exercise', sets: 3, reps: 10, weight: 100, unit: 'lbs', muscle: 'Chest' }],
            cardio: [{ type: 'Treadmill', duration: 20, settings: '12% incline, 3mph' }],
            foods: [{ name: 'Chicken Potatoes Veggies', calories: 450, protein: 56, carbs: 39, fat: 6 }],
            calories: 450, protein: 56, carbs: 39, fat: 6,
            final_log: {
              grade: 'A',
              headline: 'Test Day Logged Successfully',
              cutProgress: 'This is a test entry to confirm the save pipeline works.',
              trainerNote: 'If you can see this in your dashboard, everything is working.',
              highlight: 'Got the app fully connected.',
              tomorrowFocus: 'Start logging real data.'
            }
          }, null, 2))}
          style={{ width: '100%', background: '#f4f4f4', border: '1px solid #eee', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Load Test Data
        </button>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 6, textAlign: 'center' }}>Tap above to load sample data, then hit Save to test</div>
      </div>
    </div>
  )
}
