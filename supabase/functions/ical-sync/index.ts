// Edge Function: ical-sync
// Fetches iCal feeds from Airbnb and Gathern for each unit.
// Upserts bookings into the `bookings` table.
// Intended to run every 15 minutes via a pg_cron job:
//   SELECT cron.schedule('ical-sync', '*/15 * * * *', 'SELECT net.http_post(...)');

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ICAL from 'https://esm.sh/ical.js@1.5.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type BookingSource = 'airbnb' | 'gathern' | 'direct'

interface ParsedEvent {
  uid: string
  summary: string
  dtstart: string
  dtend: string
  source: BookingSource
}

function parseIcal(raw: string, source: BookingSource): ParsedEvent[] {
  const jcal = ICAL.parse(raw)
  const comp  = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents('vevent')
  const events: ParsedEvent[] = []

  for (const vevent of vevents) {
    const ev = new ICAL.Event(vevent)
    const uid     = vevent.getFirstPropertyValue('uid') as string
    const summary = ev.summary ?? 'Airbnb Reservation'

    // Skip blocked / unavailable placeholders that aren't real bookings
    if (/not available|airbnb.*blocked|block/i.test(summary)) continue

    events.push({
      uid,
      summary,
      dtstart: ev.startDate.toJSDate().toISOString(),
      dtend:   ev.endDate.toJSDate().toISOString(),
      source,
    })
  }

  return events
}

async function syncUnit(
  unitId: string,
  feeds: { url: string; source: BookingSource }[],
) {
  for (const { url, source } of feeds) {
    let raw: string
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (!res.ok) continue
      raw = await res.text()
    } catch {
      continue
    }

    const events = parseIcal(raw, source)

    for (const ev of events) {
      // Use external UID as the idempotency key (stored in notes field)
      const { data: existing } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('unit_id', unitId)
        .eq('notes', `ical:${ev.uid}`)
        .maybeSingle()

      const checkin  = ev.dtstart.slice(0, 10) // date only
      const checkout = ev.dtend.slice(0, 10)
      const now      = new Date().toISOString()

      // Determine status from dates
      let status: 'upcoming' | 'active' | 'completed'
      if (checkout < now.slice(0, 10)) status = 'completed'
      else if (checkin <= now.slice(0, 10)) status = 'active'
      else status = 'upcoming'

      if (existing) {
        // Only update mutable fields; preserve manual edits to guest_name
        await supabase.from('bookings').update({ checkin, checkout, status }).eq('id', existing.id)
      } else {
        await supabase.from('bookings').insert({
          unit_id: unitId,
          guest_name: ev.summary,
          checkin,
          checkout,
          price: 0,
          source,
          status,
          notes: `ical:${ev.uid}`,
        })
      }
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Fetch all units that have iCal feed URLs stored in their config
  const { data: units, error } = await supabase
    .from('units')
    .select('id, name, config')

  if (error || !units) {
    return new Response(JSON.stringify({ error: 'failed to fetch units' }), { status: 500 })
  }

  const results: { unit: string; synced: boolean }[] = []

  for (const unit of units) {
    const config = unit.config as Record<string, unknown>
    const feeds: { url: string; source: BookingSource }[] = []

    if (typeof config?.airbnb_ical === 'string') {
      feeds.push({ url: config.airbnb_ical, source: 'airbnb' })
    }
    if (typeof config?.gathern_ical === 'string') {
      feeds.push({ url: config.gathern_ical, source: 'gathern' })
    }

    if (feeds.length === 0) {
      results.push({ unit: unit.name, synced: false })
      continue
    }

    await syncUnit(unit.id, feeds)
    results.push({ unit: unit.name, synced: true })
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
