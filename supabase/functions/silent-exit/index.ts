// Edge Function: silent-exit
// Called by the Raspberry Pi sensor when motion/door activity goes silent
// after a booking period. Detects if the guest left without formal checkout.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const TWILIO_SID   = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM  = Deno.env.get('TWILIO_WHATSAPP_FROM')!
const OWNER_PHONE  = Deno.env.get('OWNER_WHATSAPP_PHONE')!

async function sendWhatsApp(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({ From: TWILIO_FROM, To: `whatsapp:${to}`, Body: body })
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { unit_id, silent_since } = await req.json()
  if (!unit_id) return new Response(JSON.stringify({ error: 'unit_id required' }), { status: 400 })

  // Find active booking for this unit
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, units(name)')
    .eq('unit_id', unit_id)
    .eq('status', 'active')
    .maybeSingle()

  if (!booking) {
    return new Response(JSON.stringify({ ok: true, note: 'no active booking' }), { status: 200 })
  }

  const checkout = new Date(booking.checkout)
  const now = new Date()

  // Only trigger silent-exit detection if within 3h of scheduled checkout
  const hoursToCheckout = (checkout.getTime() - now.getTime()) / 3600000
  if (hoursToCheckout > 3) {
    return new Response(JSON.stringify({ ok: true, note: 'too early for silent-exit' }), { status: 200 })
  }

  // Update sensor data
  await supabase.from('sensors_data').upsert({
    unit_id,
    motion_detected: false,
    door_opened: false,
    last_heartbeat: silent_since ?? now.toISOString(),
  }, { onConflict: 'unit_id' })

  // Log the event
  await supabase.from('activity_logs').insert({
    unit_id,
    event_type: 'PROPERTY_EMPTY',
    details: {
      booking_id: booking.id,
      guest_name: booking.guest_name,
      silent_since: silent_since ?? now.toISOString(),
      scheduled_checkout: booking.checkout,
    },
  })

  // Notify owner
  if (OWNER_PHONE) {
    const msg = `🏚️ يبدو أن الضيف *${booking.guest_name}* غادر ${booking.units.name} بهدوء.\n\nموعد المغادرة المجدول: ${checkout.toLocaleTimeString('ar-SA')}\n\nيُرجى التحقق من العقار وتحديث الحالة.`
    await sendWhatsApp(OWNER_PHONE, msg)
  }

  // Notify guest via WhatsApp to confirm departure
  if (booking.guest_phone) {
    const msg = `مرحباً ${booking.guest_name}،\n\nلاحظنا أن العقار أصبح هادئاً. هل أتممت المغادرة؟\n\nإذا كنت بحاجة لمساعدة، راسلنا هنا.\n\nشكراً 🙏`
    await sendWhatsApp(booking.guest_phone, msg)
  }

  return new Response(JSON.stringify({ ok: true, event: 'PROPERTY_EMPTY' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
