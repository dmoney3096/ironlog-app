import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const T = { calories: 1850, protein: 160, carbs: 190, fat: 55, water: 8 }
const VEGAS_DATE = '2026-07-16'

const daysUntilVegas = () => {
  const t = new Date(); t.setHours(0,0,0,0)
  const v = new Date(VEGAS_DATE); v.setHours(0,0,0,0)
  return Math.max(0, Math.round((v - t) / 86400000))
}
const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
const fmtShort = s => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })

export default function Dashboard() {
  const [logs, setLogs] = useState([])
  const [prs, setPrs] = useState([])
  const [tab, setTab] = useState('today')
  const [loading, setLoading] = useState(true)
  const [expandDay, setExpandDay] = useState(null)
  const [dark, setDark] = useState(false)
  const [saveInput, setSaveInput] = useState('')
  const [saveStatus, setSaveStatus] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)

  async function handleSave() {
    if (!saveInput.trim()) return
    setSaveLoading(true)
    setSaveStatus(null)
    try {
      const data = JSON.parse(saveInput.trim())
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.success) {
        setSaveStatus({ type: 'ok', msg: `✓ Saved! Tap Today or History to see it.` })
        setSaveInput('')
        fetchData()
      } else {
        setSaveStatus({ type: 'err', msg: result.error || 'Save failed' })
      }
    } catch (e) {
      setSaveStatus({ type: 'err', msg: 'Invalid format — paste the exact JSON from Claude' })
    }
    setSaveLoading(false)
  }

  function loadTestData() {
    setSaveInput(JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      weight: 156.8, weight_unit: 'lbs',
      workouts: [{ exercise: 'Test Exercise', sets: 3, reps: 10, weight: 100, unit: 'lbs', muscle: 'Chest' }],
      cardio: [{ type: 'Treadmill', duration: 20, settings: '12% incline, 3mph' }],
      foods: [{ name: 'Chicken Potatoes Veggies', calories: 450, protein: 56, carbs: 39, fat: 6 }],
      calories: 450, protein: 56, carbs: 39, fat: 6,
      final_log: { grade: 'A', headline: 'Test Entry', cutProgress: 'Test entry.', trainerNote: 'Pipeline working.', highlight: 'App connected.', tomorrowFocus: 'Log real data.' }
    }, null, 2))
  }

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: logsData }, { data: prsData }] = await Promise.all([
      supabase.from('logs').select('*').order('date', { ascending: false }),
      supabase.from('prs').select('*').order('exercise')
    ])
    setLogs(logsData || [])
    setPrs(prsData || [])
    setLoading(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs.find(l => l.date === today)
  const todayMacros = (todayLog?.foods || []).reduce((a, f) => ({
    cal: a.cal + (f.calories || 0), pro: a.pro + (f.protein || 0),
    carb: a.carb + (f.carbs || 0), fat: a.fat + (f.fat || 0)
  }), { cal: 0, pro: 0, carb: 0, fat: 0 })

  const [chartRange, setChartRange] = useState('all')

  const rangeMap = { '2w': 14, '1m': 30, '3m': 90, 'all': 9999 }
  const recentLogs = [...logs].slice(0, rangeMap[chartRange]).reverse()
  const weightData = recentLogs.filter(l => l.weight).map(l => ({ date: fmtShort(l.date), weight: l.weight }))
  const calData = recentLogs.filter(l => l.calories > 0).map(l => ({ date: fmtShort(l.date), calories: l.calories || 0 }))
  const proData = recentLogs.filter(l => l.protein > 0).map(l => ({ date: fmtShort(l.date), protein: l.protein || 0 }))
  const volData = recentLogs.filter(l => (l.workouts||[]).length > 0).map(l => ({ date: fmtShort(l.date), sets: (l.workouts || []).length }))

  const last7 = logs.slice(0, 7)
  const avgCal = last7.length ? Math.round(last7.reduce((a, l) => a + (l.calories || 0), 0) / last7.length) : 0
  const avgPro = last7.length ? Math.round(last7.reduce((a, l) => a + (l.protein || 0), 0) / last7.length) : 0
  const trainDays = last7.filter(l => (l.workouts || []).length > 0).length
  const weights = last7.filter(l => l.weight).map(l => l.weight)
  const weightChange = weights.length >= 2 ? (weights[0] - weights[weights.length - 1]).toFixed(1) : null

  const totalDeficit = logs.reduce((a, l) => a + (l.calories > 0 ? T.calories - l.calories : 0), 0)
  const lbsBurned = (totalDeficit / 3500).toFixed(1)

  const bg = dark ? '#111' : '#f4f4f4'
  const card = dark ? '#1a1a1a' : '#fff'
  const border = dark ? '#2a2a2a' : '#eee'
  const text = dark ? '#f0f0f0' : '#111'
  const muted = dark ? '#555' : '#aaa'

  const tabs = [
    { id: 'today', label: '📋 Today' },
    { id: 'stats', label: '📈 Stats' },
    { id: 'prs', label: '🏆 PRs' },
    { id: 'history', label: '📅 History' },
    { id: 'save', label: '💾 Save' },
  ]

  return (
    <div style={{ background: bg, minHeight: '100vh', color: text, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Iron<span style={{ color: '#e85c00' }}>Log</span></div>
          <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: todayLog ? '#dcfce7' : '#f3f4f6', color: todayLog ? '#16a34a' : '#9ca3af' }}>
            {todayLog ? '● LOGGED' : '○ NO ENTRY'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e85c00', lineHeight: 1 }}>{daysUntilVegas()}</div>
            <div style={{ fontSize: 9, color: muted }}>days to Vegas</div>
          </div>
          <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 16 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={fetchData} style={{ background: '#e85c00', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Macro bar */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: '10px 16px', display: 'flex', gap: 12 }}>
        {[
          { label: 'CAL', val: todayMacros.cal, target: T.calories, color: '#e85c00', unit: '' },
          { label: 'PRO', val: todayMacros.pro, target: T.protein, color: '#2563eb', unit: 'g' },
          { label: 'CARB', val: todayMacros.carb, target: T.carbs, color: '#d97706', unit: 'g' },
          { label: 'FAT', val: todayMacros.fat, target: T.fat, color: '#6b7280', unit: 'g' },
        ].map(m => (
          <div key={m.label} style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: muted, textTransform: 'uppercase' }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.val}{m.unit}<span style={{ color: muted, fontWeight: 400 }}>/{m.target}{m.unit}</span></span>
            </div>
            <div style={{ height: 3, background: border, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${Math.min(100, (m.val / m.target) * 100)}%`, background: m.color, borderRadius: 2, transition: 'width .3s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, display: 'flex', padding: '0 12px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '11px 4px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #e85c00' : '2px solid transparent', color: tab === t.id ? '#e85c00' : muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 12, maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: muted }}>Loading...</div>}

        {/* TODAY TAB */}
        {!loading && tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!todayLog ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💪</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No entry yet today</div>
                <div style={{ color: muted, fontSize: 14, marginBottom: 16 }}>Log your day in Claude chat — it'll appear here automatically</div>
                <div style={{ background: '#fff4ee', border: '1px solid #fbd0b0', borderRadius: 10, padding: 14, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e85c00', marginBottom: 8 }}>HOW TO LOG</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                    Open Claude → this project<br/>
                    Type: <strong>FINAL LOG</strong><br/>
                    Your data saves here automatically
                  </div>
                </div>
              </div>
            ) : (
              <>
                {todayLog.weight && (
                  <Card card={card} border={border}>
                    <Label color={muted}>⚖️ BODY WEIGHT</Label>
                    <div style={{ fontSize: 42, fontWeight: 800, color: '#e85c00', lineHeight: 1 }}>{todayLog.weight} <span style={{ fontSize: 20, color: muted, fontWeight: 500 }}>{todayLog.weight_unit || 'lbs'}</span></div>
                  </Card>
                )}
                {todayLog.workouts?.length > 0 && (
                  <Card card={card} border={border}>
                    <Label color={muted}>🏋️ WORKOUTS</Label>
                    {todayLog.workouts.map((w, i) => (
                      <Row key={i} border={border}>
                        <span style={{ flex: 1, color: text }}>{w.exercise}</span>
                        <span style={{ fontWeight: 700, color: '#e85c00' }}>{w.sets && w.reps ? `${w.sets}×${w.reps}` : ''}{w.weight ? ` @ ${w.weight}${w.unit || ''}` : ''}</span>
                        {w.muscle && <span style={{ fontSize: 10, color: muted, background: border, borderRadius: 4, padding: '2px 6px' }}>{w.muscle}</span>}
                      </Row>
                    ))}
                  </Card>
                )}
                {todayLog.cardio?.length > 0 && (
                  <Card card={card} border={border}>
                    <Label color={muted}>🏃 CARDIO</Label>
                    {todayLog.cardio.map((c, i) => (
                      <Row key={i} border={border}>
                        <span style={{ flex: 1, color: text }}>{c.type}</span>
                        <span style={{ fontWeight: 700, color: '#e85c00' }}>{c.duration} min{c.settings ? ` · ${c.settings}` : ''}</span>
                      </Row>
                    ))}
                  </Card>
                )}
                {todayLog.foods?.length > 0 && (
                  <Card card={card} border={border}>
                    <Label color={muted}>🥗 NUTRITION</Label>
                    {todayLog.foods.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${border}`, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ color: text }}>{f.name}</span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {f.calories && <Pill color="#e85c00" bg="#fff0e6">{f.calories}</Pill>}
                          {f.protein && <Pill color="#2563eb" bg="#eff6ff">{f.protein}P</Pill>}
                          {f.carbs && <Pill color="#d97706" bg="#fef3c7">{f.carbs}C</Pill>}
                          {f.fat && <Pill color="#6b7280" bg="#f3f4f6">{f.fat}F</Pill>}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${border}`, marginTop: 4, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: muted }}>TOTAL</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Pill color="#e85c00" bg="#fff0e6">{todayMacros.cal} kcal</Pill>
                        <Pill color="#2563eb" bg="#eff6ff">{todayMacros.pro}g P</Pill>
                        <Pill color="#d97706" bg="#fef3c7">{todayMacros.carb}g C</Pill>
                      </div>
                    </div>
                  </Card>
                )}
                {todayLog.final_log && (
                  <Card card="#fffbeb" border="#fde68a">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 44, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{todayLog.final_log.grade}</span>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{todayLog.final_log.headline}</span>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Cut Progress</div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 10 }}>{todayLog.final_log.cutProgress}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Trainer Note</div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 10 }}>{todayLog.final_log.trainerNote}</div>
                    {todayLog.final_log.tomorrowFocus && <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Tomorrow</div>
                      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 10 }}>{todayLog.final_log.tomorrowFocus}</div>
                    </>}
                    <div style={{ background: '#fef3c7', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#92400e', fontWeight: 500 }}>🏆 {todayLog.final_log.highlight}</div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {!loading && tab === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Vegas tracker */}
            <Card card={card} border={border}>
              <Label color={muted}>🎯 VEGAS CUT TRACKER</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { val: lbsBurned, lbl: 'lbs burned (est)' },
                  { val: daysUntilVegas(), lbl: 'days remaining' },
                  { val: logs.length, lbl: 'days logged' },
                  { val: totalDeficit.toLocaleString(), lbl: 'total deficit (kcal)' },
                ].map((s, i) => (
                  <div key={i} style={{ background: dark ? '#222' : '#f9f9f9', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#e85c00' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 8, background: border, borderRadius: 6 }}>
                <div style={{ height: '100%', width: `${Math.min(100, (logs.length / (logs.length + daysUntilVegas())) * 100)}%`, background: '#e85c00', borderRadius: 6 }} />
              </div>
            </Card>
            {/* Weekly summary */}
            <Card card={card} border={border}>
              <Label color={muted}>📊 LAST 7 DAYS</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { val: avgCal, lbl: 'Avg Calories' },
                  { val: avgPro + 'g', lbl: 'Avg Protein' },
                  { val: `${trainDays}/7`, lbl: 'Training Days' },
                  { val: weightChange !== null ? (weightChange < 0 ? weightChange : '+' + weightChange) + ' lbs' : '—', lbl: 'Weight Change', color: weightChange < 0 ? '#16a34a' : '#e85c00' },
                ].map((s, i) => (
                  <div key={i} style={{ background: dark ? '#222' : '#f9f9f9', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color || '#e85c00' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </Card>
            <ChartCard title="Weight Trend" card={card} border={border}>
              {/* Range selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[['2w','2 Weeks'],['1m','1 Month'],['3m','3 Months'],['all','All Time']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setChartRange(val)} style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700, border: `1px solid ${chartRange === val ? '#e85c00' : border}`, borderRadius: 7, background: chartRange === val ? '#e85c00' : card, color: chartRange === val ? '#fff' : muted, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{lbl}</button>
                ))}
              </div>
              {weightData.length > 1 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#aaa' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#aaa' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="weight" stroke="#e85c00" strokeWidth={2} dot={{ r: 3, fill: '#e85c00' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
            <ChartCard title="Daily Calories" card={card} border={border} target={`Target: ${T.calories} kcal`}>
              {calData.filter(d => d.calories > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={calData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#aaa' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#aaa' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="calories" fill="#e85c00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
            <ChartCard title="Daily Protein (g)" card={card} border={border} target={`Target: ${T.protein}g`}>
              {proData.filter(d => d.protein > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={proData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#aaa' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#aaa' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="protein" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
            <ChartCard title="Workout Volume (sets/day)" card={card} border={border}>
              {volData.filter(d => d.sets > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={volData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#aaa' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#aaa' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="sets" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>
        )}

        {/* PRs TAB */}
        {!loading && tab === 'prs' && (
          <Card card={card} border={border}>
            <Label color={muted}>🏆 PERSONAL RECORDS</Label>
            {prs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: muted }}>PRs auto-detected as you log workouts in Claude</div>
            ) : prs.map((p, i) => (
              <Row key={i} border={border}>
                <div>
                  <div style={{ fontWeight: 600, color: text }}>{p.exercise}</div>
                  <div style={{ fontSize: 11, color: muted }}>{p.date ? fmtDate(p.date) : ''}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{p.weight}{p.unit || 'lbs'} × {p.reps || '?'}</div>
              </Row>
            ))}
          </Card>
        )}

        {/* HISTORY TAB */}
        {!loading && tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: muted }}>No days logged yet</div>
            ) : logs.map(log => (
              <div key={log.date} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div onClick={() => setExpandDay(expandDay === log.date ? null : log.date)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: text }}>{fmtDate(log.date)}</div>
                    {log.final_log?.headline && <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{log.final_log.headline}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {log.weight && <Pill color="#e85c00" bg="#fff0e6">{log.weight}lbs</Pill>}
                    {log.workouts?.length > 0 && <Pill color="#2563eb" bg="#eff6ff">{log.workouts.length} sets</Pill>}
                    {log.final_log?.grade && <span style={{ fontSize: 13, fontWeight: 800, color: '#d97706', background: '#fef3c7', borderRadius: 6, padding: '2px 9px' }}>{log.final_log.grade}</span>}
                    <span style={{ fontSize: 11, color: muted }}>{expandDay === log.date ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expandDay === log.date && (
                  <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${border}` }}>
                    {log.calories > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        <Pill color="#e85c00" bg="#fff0e6">{log.calories} kcal</Pill>
                        <Pill color="#2563eb" bg="#eff6ff">{log.protein}g P</Pill>
                        <Pill color="#d97706" bg="#fef3c7">{log.carbs}g C</Pill>
                      </div>
                    )}
                    {log.workouts?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', marginBottom: 6 }}>Workouts</div>
                        {log.workouts.map((w, i) => (
                          <Row key={i} border={border}>
                            <span style={{ flex: 1, color: text }}>{w.exercise}</span>
                            <span style={{ fontWeight: 700, color: '#e85c00', fontSize: 13 }}>{w.sets && w.reps ? `${w.sets}×${w.reps}` : ''}{w.weight ? ` @ ${w.weight}${w.unit || ''}` : ''}</span>
                          </Row>
                        ))}
                      </div>
                    )}
                    {log.final_log && (
                      <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: `1px solid ${border}`, marginTop: 10 }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706' }}>{log.final_log.grade}</div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginBottom: 4 }}>Trainer Note</div>
                          <div style={{ fontSize: 13, color: text === '#111' ? '#555' : '#aaa', lineHeight: 1.6 }}>{log.final_log.trainerNote}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* SAVE TAB */}
        {!loading && tab === 'save' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#fff4ee', border: '1px solid #fbd0b0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e85c00', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>HOW TO LOG</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
                1. Type <strong>FINAL LOG</strong> in Claude chat<br />
                2. Copy the JSON block Claude gives you<br />
                3. Paste it below and tap Save
              </div>
            </div>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>PASTE LOG DATA</div>
              <textarea
                value={saveInput}
                onChange={e => setSaveInput(e.target.value)}
                placeholder={'{\n  "date": "2026-05-27",\n  "weight": 156.8,\n  ...\n}'}
                style={{ width: '100%', minHeight: 180, background: dark ? '#222' : '#f9f9f9', border: `1px solid ${border}`, borderRadius: 10, padding: '11px 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical', lineHeight: 1.6, color: text }}
              />
              <button
                onClick={handleSave}
                disabled={saveLoading || !saveInput.trim()}
                style={{ width: '100%', marginTop: 10, background: '#e85c00', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, padding: 14, cursor: 'pointer', opacity: saveLoading || !saveInput.trim() ? .4 : 1 }}
              >
                {saveLoading ? 'Saving...' : 'Save to Dashboard →'}
              </button>
            </div>
            {saveStatus && (
              <div style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 500, background: saveStatus.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: saveStatus.type === 'ok' ? '#166534' : '#991b1b', border: `1px solid ${saveStatus.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
                {saveStatus.msg}
              </div>
            )}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>QUICK TEST</div>
              <button onClick={loadTestData} style={{ width: '100%', background: dark ? '#222' : '#f4f4f4', border: `1px solid ${border}`, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: dark ? '#aaa' : '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Load Test Data
              </button>
              <div style={{ fontSize: 11, color: muted, marginTop: 6, textAlign: 'center' }}>Tap to load sample, then Save to test</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mini components ───────────────────────────────────────────────────────────
function Card({ children, card, border }) {
  return <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 14 }}>{children}</div>
}
function Label({ children, color }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{children}</div>
}
function Row({ children, border }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${border}`, gap: 8, flexWrap: 'wrap' }}>{children}</div>
}
function Pill({ children, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color, background: bg }}>{children}</span>
}
function ChartCard({ title, children, card, border, target }) {
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {children}
      {target && <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 6 }}>{target}</div>}
    </div>
  )
}
function Empty() {
  return <div style={{ textAlign: 'center', padding: 24, color: '#ccc', fontSize: 13 }}>Log data to see chart</div>
}
