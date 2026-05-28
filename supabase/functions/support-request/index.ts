// Edge Function: support-request
// Called when a guest submits a support request from the guest or tablet page.
// Logs to activity_logs and sends WhatsApp alert to owner.

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

const ISSUE_LABELS: Record<string, string> = {
  wifi:        'إنترنت / واي فاي',
  ac:          'تكييف / تدفئة',
  water:       'مياه ساخنة',
  electricity: 'كهرباء',
  cleaning:    'نظافة',
  noise:       'ضوضاء',
  lock:        'قفل / مفتاح',
  other:       'أخرى',
}

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

  const { unit_id, issue_type, note, guest_name } = await req.json()
  if (!unit_id || !issue_type) {
    return new Response(JSON.stringify({ error: 'unit_id and issue_type required' }), { status: 400 })
  }

  // Fetch unit for name
  const { data: unit } = await supabase
    .from('units')
    .select('name')
    .eq('id', unit_id)
    .single()

  const issueLabel = ISSUE_LABELS[issue_type] ?? issue_type
  const guestLabel = guest_name ?? 'ضيف'

  // Log the support request
  await supabase.from('activity_logs').insert({
    unit_id,
    event_type: 'SUPPORT_REQUEST',
    details: { issue_type, issue_label: issueLabel, note: note ?? '', guest_name: guestLabel },
  })

  // Notify owner
  if (OWNER_PHONE) {
    const msg = `🚨 طلب دعم جديد\n\n📍 العقار: *${unit?.name ?? unit_id}*\n👤 الضيف: ${guestLabel}\n🔧 المشكلة: *${issueLabel}*${note ? `\n💬 ملاحظة: ${note}` : ''}\n\nيُرجى التواصل مع الضيف في أقرب وقت.`
    await sendWhatsApp(OWNER_PHONE, msg)
  }

  return new Response(
    JSON.stringify({ ok: true, issue: issueLabel }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
