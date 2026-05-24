-- ══════════════════════════════════════════════════════════
-- Qlivn OS — Database Schema
-- نظام إدارة العقارات الذكية
-- ══════════════════════════════════════════════════════════

-- units (الوحدات)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  type TEXT CHECK (type IN ('villa', 'apartment', 'chalet')) DEFAULT 'apartment',
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance', 'cleaning')) DEFAULT 'active',
  current_guest_name TEXT,
  checkout_time TIMESTAMPTZ,
  access_code TEXT,
  wifi_password TEXT,
  welcome_message TEXT,
  config JSONB DEFAULT '{}',
  monthly_income NUMERIC DEFAULT 0,
  gathern_income NUMERIC DEFAULT 0,
  airbnb_income NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings (الحجوزات)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  checkin TIMESTAMPTZ NOT NULL,
  checkout TIMESTAMPTZ NOT NULL,
  price NUMERIC DEFAULT 0,
  source TEXT CHECK (source IN ('gathern', 'airbnb', 'direct')) DEFAULT 'direct',
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- activity_logs (سجل الأنشطة)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- access_codes (أكواد الدخول)
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- sensors_data (بيانات الحساسات)
CREATE TABLE sensors_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  motion_detected BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMPTZ,
  door_opened BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- hosts (المضيفون - للـ host layer)
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  type TEXT CHECK (type IN ('villa', 'apartment', 'chalet')) DEFAULT 'apartment',
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  welcome_message TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- automations (الأتمتة)
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- events_log (سجل الأحداث)
CREATE TABLE events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES hosts(id),
  unit_id UUID REFERENCES units(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enable Row Level Security ──────────────────────────────────
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_log ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (adjust for production auth) ─────────────────
CREATE POLICY "public_read_units" ON units FOR SELECT USING (true);
CREATE POLICY "public_write_units" ON units FOR ALL USING (true);

CREATE POLICY "public_read_bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "public_write_bookings" ON bookings FOR ALL USING (true);

CREATE POLICY "public_read_activity_logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "public_write_activity_logs" ON activity_logs FOR ALL USING (true);

CREATE POLICY "public_read_access_codes" ON access_codes FOR SELECT USING (true);
CREATE POLICY "public_write_access_codes" ON access_codes FOR ALL USING (true);

CREATE POLICY "public_sensors" ON sensors_data FOR ALL USING (true);
CREATE POLICY "public_hosts" ON hosts FOR ALL USING (true);
CREATE POLICY "public_automations" ON automations FOR ALL USING (true);
CREATE POLICY "public_events_log" ON events_log FOR ALL USING (true);

-- ── Seed Data ─────────────────────────────────────────────────
INSERT INTO units (name, location, type, status, wifi_password, welcome_message, monthly_income, gathern_income, airbnb_income) VALUES
  ('شقة الياسمين', 'الرياض - النزهة', 'apartment', 'active', 'Qlivn@2024', 'أهلاً بك في شقة الياسمين، نتمنى لك إقامة سعيدة ومريحة', 12000, 7000, 5000),
  ('فيلا الأندلس', 'جدة - الشاطئ', 'villa', 'active', 'Villa@2024', 'مرحباً بك في فيلا الأندلس، استمتع بالأجواء الرائعة', 25000, 15000, 10000),
  ('شاليه الجبل', 'الطائف', 'chalet', 'maintenance', 'Chalet@2024', 'أهلاً وسهلاً في شاليه الجبل', 8000, 5000, 3000);

INSERT INTO hosts (name, location, type, status, welcome_message, config) VALUES
  ('فيلا الياسمين', 'الرياض - النزهة', 'villa', 'active', 'أهلاً بك في فيلا الياسمين',
   '{"modules":{"sports":{"enabled":true,"leagues":["saudi","champions"],"match_day_only":false},"music":{"enabled":true,"genre":"khaliji","auto_on":true},"lighting":{"enabled":true,"scene":"warm","auto_dim":true},"tv":{"enabled":false,"default_ch":"SSC"},"presence":{"enabled":true,"sensitivity":"medium"},"ai":{"enabled":true,"personality":"friendly"}}}'),
  ('شقة السلام', 'جدة - الروضة', 'apartment', 'active', 'مرحباً بكم',
   '{"modules":{"sports":{"enabled":false,"leagues":[],"match_day_only":false},"music":{"enabled":true,"genre":"lounge","auto_on":true},"lighting":{"enabled":true,"scene":"cool","auto_dim":true},"tv":{"enabled":false,"default_ch":"MBC"},"presence":{"enabled":true,"sensitivity":"medium"},"ai":{"enabled":true,"personality":"professional"}}}'),
  ('شاليه النخيل', 'الدمام - الشاطئ', 'chalet', 'inactive', 'أهلاً وسهلاً',
   '{"modules":{"sports":{"enabled":true,"leagues":["saudi"],"match_day_only":true},"music":{"enabled":true,"genre":"arabic","auto_on":false},"lighting":{"enabled":true,"scene":"bright","auto_dim":false},"tv":{"enabled":true,"default_ch":"SSC"},"presence":{"enabled":true,"sensitivity":"high"},"ai":{"enabled":false,"personality":"minimal"}}}');
