// Edge Function: eco-mode
// Triggered by sensors_data change (via database webhook or pg_cron).
// If the unit has been empty for > 30 minutes post-checkout, send an eco-mode
// command to the Raspberry Pi controller to cut AC and lighting.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Pi controller base URL (set per-deployment via env)
const PI_BASE_URL = Deno.env.get('PI_CONTROLLER_URL') // e.g. http://192.168.1.50:8000

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const payload = await req.json()
  // Supabase webhook sends: { type: 'UPDATE', record: {...}, old_record: {...} }
  const sensor = payload.record ?? payload

  const { unit_id, motion_detected, last_heartbeat } = sensor
  if (!unit_id) return new Response('unit_id required', { status: 400 })

  // Only activate eco mode when no motion detected
  if (motion_detected) {
    return new Response(JSON.stringify({ ok: true, eco: false }), { status: 200 })
  }

  const lastSeen = last_heartbeat ? new Date(last_heartbeat) : new Date()
  const minutesSilent = (Date.now() - lastSeen.getTime()) / 60000

  if (minutesSilent < 30) {
    return new Response(JSON.stringify({ ok: true, eco: false, minutesSilent }), { status: 200 })
  }

  // Check there's no upcoming booking in the next 2 hours
  const twoHoursLater = new Date(Date.now() + 2 * 3600000).toISOString()
  const { data: upcoming } = await supabase
    .from('bookings')
    .select('id')
    .eq('unit_id', unit_id)
    .eq('status', 'upcoming')
    .lte('checkin', twoHoursLater)
    .maybeSingle()

  if (upcoming) {
    return new Response(JSON.stringify({ ok: true, eco: false, note: 'upcoming booking soon' }), { status: 200 })
  }

  // Log eco-mode activation
  await supabase.from('activity_logs').insert({
    unit_id,
    event_type: 'ECO_MODE_ON',
    details: { minutes_silent: Math.round(minutesSilent), triggered_at: new Date().toISOString() },
  })

  // Update unit status
  await supabase.from('units').update({ status: 'inactive' }).eq('id', unit_id)

  // Send command to Pi controller if configured
  if (PI_BASE_URL) {
    await fetch(`${PI_BASE_URL}/eco`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_id, action: 'eco_on' }),
    }).catch(() => {/* Pi might be offline — non-fatal */})
  }

  return new Response(
    JSON.stringify({ ok: true, eco: true, minutesSilent: Math.round(minutesSilent) }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
