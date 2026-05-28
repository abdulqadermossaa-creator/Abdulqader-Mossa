-- ══════════════════════════════════════════════════════════════
-- Qlivn OS — pg_cron Scheduled Jobs
-- Run once in Supabase SQL Editor after enabling the pg_cron extension:
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
-- Replace <PROJECT_REF> and <ANON_KEY> with your Supabase project values.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Checkout countdown — every 5 minutes ───────────────────
SELECT cron.schedule(
  'checkout-countdown',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/checkout-countdown',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── 2. iCal sync — every 15 minutes ──────────────────────────
SELECT cron.schedule(
  'ical-sync',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/ical-sync',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── 3. Auto smart-checkin — every minute ─────────────────────
-- Finds bookings whose check-in time is now and calls smart-checkin
SELECT cron.schedule(
  'auto-smart-checkin',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/smart-checkin',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
      body    := (
        SELECT json_build_object('booking_id', id)::text
        FROM bookings
        WHERE status = 'upcoming'
          AND checkin::timestamp <= now()
          AND checkin::timestamp > now() - interval '5 minutes'
        LIMIT 1
      )::jsonb
    )
    FROM bookings
    WHERE status = 'upcoming'
      AND checkin::timestamp <= now()
      AND checkin::timestamp > now() - interval '5 minutes';
  $$
);

-- ── View scheduled jobs ───────────────────────────────────────
-- SELECT * FROM cron.job;

-- ── Remove a job ──────────────────────────────────────────────
-- SELECT cron.unschedule('checkout-countdown');
