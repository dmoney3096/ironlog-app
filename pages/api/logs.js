import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = req.body
    const entries = Array.isArray(body) ? body : [body]

    // Validate all entries have dates
    for (const entry of entries) {
      if (!entry.date) return res.status(400).json({ error: 'Date required for all entries' })
    }

    const { data, error } = await supabase
      .from('logs')
      .upsert(entries, { onConflict: 'date' })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, data, count: entries.length })
  }

  if (req.method === 'GET') {
    const { date } = req.query
    let query = supabase.from('logs').select('*').order('date', { ascending: false })
    if (date) query = query.eq('date', date)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
