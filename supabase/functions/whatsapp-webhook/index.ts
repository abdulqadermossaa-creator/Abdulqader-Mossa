// Edge Function: whatsapp-webhook
// Twilio WhatsApp inbound webhook. Handles guest messages and replies
// with smart responses (access code, checkout time, support escalation).
// Set as Twilio webhook URL: POST /functions/v1/whatsapp-webhook

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

async function reply(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const params = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body })
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
}

async function notifyOwner(body: string) {
  if (OWNER_PHONE) await reply(`whatsapp:${OWNER_PHONE}`, body)
}

function parseFormBody(body: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const pair of body.split('&')) {
    const [k, v] = pair.split('=').map(decodeURIComponent)
    result[k] = v
  }
  return result
}

// Keyword-based intent detection
function detectIntent(msg: string): string {
  const m = msg.trim().toLowerCase()
  if (/رمز|كود|دخول|access|code/.test(m))       return 'access_code'
  if (/وقت|مغادرة|checkout|متى/.test(m))          return 'checkout_time'
  if (/wifi|واي فاي|إنترنت|انترنت/.test(m))       return 'wifi'
  if (/مشكلة|عطل|مساعدة|help|support/.test(m))   return 'support'
  if (/شكرا|شكراً|ممتاز|رائع|thanks/.test(m))     return 'thanks'
  return 'unknown'
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const text = await req.text()
  const form = parseFormBody(text)

  const fromRaw = form['From'] ?? ''          // whatsapp:+966XXXXXXXXX
  const body    = form['Body'] ?? ''
  const from    = fromRaw                     // keep full whatsapp: prefix for replies

  // Normalize phone for DB lookup (strip whatsapp: prefix)
  const phone = fromRaw.replace('whatsapp:', '').replace(/\s/g, '')

  // Find active booking for this phone number
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, units(name, wifi_password, access_code, checkout_time)')
    .eq('guest_phone', phone)
    .eq('status', 'active')
    .order('checkin', { ascending: false })
    .limit(1)
    .maybeSingle()

  const intent = detectIntent(body)

  if (!booking) {
    await reply(from, 'مرحباً! لم أتمكن من العثور على حجزك. إذا كنت تواجه مشكلة، يرجى التواصل مع المضيف مباشرة.')
    return new Response('ok', { status: 200 })
  }

  const unit = booking.units
  const guestName = booking.guest_name

  switch (intent) {
    case 'access_code':
      await reply(from, `مرحباً ${guestName} 👋\n🔑 رمز الوصول لـ *${unit.name}*: *${unit.access_code ?? 'غير متوفر'}*\n\nإذا لم يعمل، راسلنا مجدداً.`)
      break

    case 'checkout_time': {
      const checkoutStr = unit.checkout_time
        ? new Date(unit.checkout_time).toLocaleString('ar-SA', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
        : 'غير محدد'
      await reply(from, `⏰ موعد مغادرتك من *${unit.name}*: *${checkoutStr}*`)
      break
    }

    case 'wifi':
      await reply(from, `📶 كلمة مرور الواي فاي في *${unit.name}*:\n*${unit.wifi_password ?? 'غير متوفرة'}*`)
      break

    case 'support': {
      // Log support request
      await supabase.from('activity_logs').insert({
        unit_id: booking.unit_id,
        event_type: 'SUPPORT_REQUEST',
        details: { issue_type: 'whatsapp', message: body, guest_name: guestName, phone },
      })
      await reply(from, `شكراً ${guestName}، تلقينا رسالتك وسنتواصل معك في أقرب وقت 🙏`)
      await notifyOwner(`🚨 رسالة دعم من الضيف\n👤 الضيف: ${guestName}\n📍 العقار: ${unit.name}\n💬 الرسالة:\n${body}`)
      break
    }

    case 'thanks':
      await reply(from, `العفو ${guestName}! نتمنى لك إقامة ممتعة في *${unit.name}* 🌟`)
      break

    default:
      // Forward unknown messages to owner
      await reply(from, `شكراً على رسالتك، سنتواصل معك قريباً.`)
      await notifyOwner(`📨 رسالة من ضيف\n👤 ${guestName} — ${unit.name}\n💬 ${body}`)
  }

  return new Response('ok', { status: 200 })
})
