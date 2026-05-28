// Edge Function: smart-checkin
// Triggered when a booking transitions to "active" (check-in time reached).
// Sends welcome WhatsApp message, generates access code, logs CHECKIN_STARTED event.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const TWILIO_SID    = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM   = Deno.env.get('TWILIO_WHATSAPP_FROM')! // whatsapp:+14155238886

async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({
    From: TWILIO_FROM,
    To: `whatsapp:${to}`,
    Body: body,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  return res.json()
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { booking_id } = await req.json()
  if (!booking_id) {
    return new Response(JSON.stringify({ error: 'booking_id required' }), { status: 400 })
  }

  // Fetch booking + unit
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*, units(*)')
    .eq('id', booking_id)
    .single()

  if (bErr || !booking) {
    return new Response(JSON.stringify({ error: 'booking not found' }), { status: 404 })
  }

  const unit = booking.units
  const code = generateCode()
  const expiresAt = new Date(booking.checkout)

  // Save access code
  await supabase.from('access_codes').insert({
    unit_id: unit.id,
    code,
    expires_at: expiresAt.toISOString(),
    active: true,
    booking_id,
  })

  // Update unit with current guest info + new access code
  await supabase.from('units').update({
    current_guest_name: booking.guest_name,
    checkout_time: booking.checkout,
    access_code: code,
    status: 'active',
  }).eq('id', unit.id)

  // Update booking status to active
  await supabase.from('bookings').update({ status: 'active' }).eq('id', booking_id)

  // Log event
  await supabase.from('activity_logs').insert({
    unit_id: unit.id,
    event_type: 'CHECKIN_STARTED',
    details: { booking_id, guest_name: booking.guest_name, access_code: code },
  })

  // Send WhatsApp welcome if phone available
  if (booking.guest_phone) {
    const checkoutDate = new Date(booking.checkout).toLocaleDateString('ar-SA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const message = `مرحباً ${booking.guest_name} 👋\n\nأهلاً بك في ${unit.name}!\n\n🔑 رمز الوصول: *${code}*\n📅 موعد المغادرة: ${checkoutDate}\n\n${unit.welcome_message ?? 'نتمنى لك إقامة ممتعة'}\n\n— فريق Qlivn OS`
    await sendWhatsApp(booking.guest_phone, message)
  }

  return new Response(
    JSON.stringify({ success: true, access_code: code }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
