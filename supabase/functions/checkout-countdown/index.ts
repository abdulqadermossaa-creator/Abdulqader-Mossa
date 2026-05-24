// Edge Function: checkout-countdown
// Called by a pg_cron job every 5 minutes.
// Sends WhatsApp reminder when checkout is approaching (2h, 1h, 30min).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const TWILIO_SID   = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM  = Deno.env.get('TWILIO_WHATSAPP_FROM')!

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

// Reminder windows in minutes: [minutesBefore, label]
const WINDOWS: [number, string][] = [
  [120, 'ساعتان'],
  [60,  'ساعة واحدة'],
  [30,  '٣٠ دقيقة'],
]

serve(async () => {
  const now = new Date()

  // Find all active bookings with a checkout time
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, units(name, wifi_password)')
    .eq('status', 'active')
    .not('checkout', 'is', null)

  if (!bookings) return new Response('no bookings', { status: 200 })

  for (const booking of bookings) {
    const checkout = new Date(booking.checkout)
    const diffMin  = (checkout.getTime() - now.getTime()) / 60000

    for (const [window, label] of WINDOWS) {
      // Within ±3 minutes of the reminder window
      if (Math.abs(diffMin - window) <= 3) {
        const alreadySent = await supabase
          .from('activity_logs')
          .select('id')
          .eq('unit_id', booking.unit_id)
          .eq('event_type', 'CHECKOUT_SOON')
          .contains('details', { window_min: window, booking_id: booking.id })
          .maybeSingle()

        if (alreadySent.data) continue // already sent this reminder

        // Log it first to prevent duplicates
        await supabase.from('activity_logs').insert({
          unit_id: booking.unit_id,
          event_type: 'CHECKOUT_SOON',
          details: { booking_id: booking.id, window_min: window, guest_name: booking.guest_name },
        })

        if (booking.guest_phone) {
          const msg = `⏰ تذكير: باقي ${label} على موعد مغادرتك من ${booking.units.name}.\n\nيُرجى إتمام إجراءات المغادرة في الوقت المحدد.\n\nشكراً لاختيارك Qlivn OS 🙏`
          await sendWhatsApp(booking.guest_phone, msg)
        }
      }
    }

    // Handle checkout passed — mark as completed
    if (diffMin < -15 && booking.status === 'active') {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)
      await supabase.from('units').update({
        status: 'cleaning',
        current_guest_name: null,
        checkout_time: null,
        access_code: null,
      }).eq('id', booking.unit_id)

      await supabase.from('activity_logs').insert({
        unit_id: booking.unit_id,
        event_type: 'PROPERTY_EMPTY',
        details: { booking_id: booking.id, guest_name: booking.guest_name },
      })

      await supabase.from('activity_logs').insert({
        unit_id: booking.unit_id,
        event_type: 'CLEANING_REQUIRED',
        details: { booking_id: booking.id },
      })
    }
  }

  return new Response(JSON.stringify({ ok: true, checked: bookings.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
