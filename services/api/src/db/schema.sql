CREATE TABLE IF NOT EXISTS vets (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  specialty     TEXT NOT NULL,
  bio           TEXT,
  price_uzs     INTEGER NOT NULL,
  rating        NUMERIC(2,1) DEFAULT 5.0,
  avatar_emoji  TEXT DEFAULT '👨‍⚕️',
  experience_yr INTEGER DEFAULT 1,
  is_available  BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS consultations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id       INTEGER REFERENCES vets(id),
  client_name  TEXT NOT NULL,
  pet_name     TEXT NOT NULL,
  pet_species  TEXT NOT NULL,
  problem      TEXT NOT NULL,
  slot_time    TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','completed')),
  summary      TEXT,
  report       JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS report JSONB;
-- Video call: consultation duration (tariff snapshot) and authoritative call start
ALTER TABLE vets          ADD COLUMN IF NOT EXISTS consult_duration_min INTEGER DEFAULT 30;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS duration_min    INTEGER;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS messages (
  id                SERIAL PRIMARY KEY,
  consultation_id   UUID REFERENCES consultations(id) ON DELETE CASCADE,
  sender            TEXT NOT NULL CHECK (sender IN ('client','vet')),
  text              TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT NOT NULL,
  species       TEXT NOT NULL DEFAULT 'other'
                  CHECK (species IN ('cat','dog','rabbit','parrot','hamster','fish','other')),
  name          TEXT NOT NULL,
  breed         TEXT,
  sex           TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (sex IN ('male','female','unknown')),
  birth_date    DATE,
  weight_kg     NUMERIC(5,2),
  notes         TEXT,
  avatar_emoji  TEXT NOT NULL DEFAULT '🐾',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pets_owner_idx ON pets(owner_id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES pets(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS learn_items (
  id           SERIAL PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('article','guide','checklist')),
  category     TEXT NOT NULL,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  body         TEXT,
  steps        JSONB,
  species      TEXT[],
  duration_min INTEGER DEFAULT 5,
  emoji        TEXT DEFAULT '📄',
  sort_order   INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learn_progress (
  id            SERIAL PRIMARY KEY,
  owner_id      TEXT NOT NULL,
  item_id       INTEGER REFERENCES learn_items(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'started'
                  CHECK (status IN ('started','completed')),
  checked_steps JSONB DEFAULT '[]',
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  UNIQUE(owner_id, item_id)
);

CREATE INDEX IF NOT EXISTS learn_progress_owner_idx ON learn_progress(owner_id);
ALTER TABLE learn_items ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Редакция';
ALTER TABLE learn_items DROP CONSTRAINT IF EXISTS learn_items_type_check;
ALTER TABLE learn_items ADD CONSTRAINT learn_items_type_check
  CHECK (type IN ('article','guide','checklist','video','course','quiz'));
ALTER TABLE learn_items ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner'
  CHECK (level IN ('beginner','intermediate','advanced'));
ALTER TABLE learn_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS vendor_credentials (
  id         SERIAL PRIMARY KEY,
  vet_id     INTEGER UNIQUE REFERENCES vets(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  phone      TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vendor_credentials ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS good_deeds (
  id                 SERIAL PRIMARY KEY,
  title              TEXT NOT NULL,
  subtitle           TEXT,
  description        TEXT,
  category           TEXT NOT NULL CHECK (category IN ('shelter','rescue','sterilization','feeding','adoption','other')),
  goal_amount        INTEGER,
  raised_amount      INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  emoji              TEXT DEFAULT '🤝',
  deadline           DATE,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  sort_order         INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deed_participations (
  id         SERIAL PRIMARY KEY,
  owner_id   TEXT NOT NULL,
  deed_id    INTEGER REFERENCES good_deeds(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('donate','volunteer','share')),
  amount_uzs INTEGER,
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deed_participations_owner_idx ON deed_participations(owner_id);
CREATE INDEX IF NOT EXISTS deed_participations_deed_idx ON deed_participations(deed_id);

CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'moderator'
             CHECK (role IN ('moderator','support','admin')),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES admin_users(id),
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  detail      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS vendor_verification (
  id          SERIAL PRIMARY KEY,
  vet_id      INTEGER UNIQUE REFERENCES vets(id),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  comment     TEXT,
  doc_type    TEXT,
  doc_ref     TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_services (
  id           SERIAL PRIMARY KEY,
  vet_id       INTEGER REFERENCES vets(id) ON DELETE CASCADE,
  title_ru     TEXT NOT NULL,
  title_uz     TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'vet_online'
               CHECK (category IN ('vet_online','vet_offline','vaccination','surgery','grooming','training','nutrition','other')),
  description  TEXT NOT NULL DEFAULT '',
  price_uzs    INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER NOT NULL DEFAULT 30,
  format       TEXT NOT NULL DEFAULT 'online'
               CHECK (format IN ('online','offline')),
  is_active    BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vendor_services_vet_idx ON vendor_services(vet_id);

CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'vet_online',
  vet_id       INTEGER REFERENCES vets(id),
  pet_id       UUID,
  scheduled_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'created'
               CHECK (status IN ('created','paid','accepted','in_progress','completed','cancelled','refunded')),
  price_uzs    INTEGER,
  provider     TEXT CHECK (provider IN ('click','payme','uzum')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS consultation_id UUID;

CREATE TABLE IF NOT EXISTS promo_codes (
  id             SERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  discount_type  TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  max_uses       INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  expires_at     DATE,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foods (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  brand         TEXT NOT NULL,
  species       TEXT[] NOT NULL,
  life_stages   TEXT[] NOT NULL,
  weight_class  TEXT[],
  health_tags   TEXT[],
  price_uzs     INTEGER NOT NULL,
  budget_tier   TEXT NOT NULL CHECK (budget_tier IN ('economy','mid','premium')),
  avatar_emoji  TEXT NOT NULL DEFAULT '🥘',
  description   TEXT,
  rating        NUMERIC(2,1) DEFAULT 4.5,
  is_active     BOOLEAN DEFAULT true
);

-- M3: telegram_id for vendor push notifications
ALTER TABLE vendor_credentials ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
-- Vendor onboarding: email is optional (phone-first registration)
ALTER TABLE vendor_credentials ALTER COLUMN email DROP NOT NULL;

-- Telegram Mini App users (M3)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  name        TEXT,
  locale      TEXT DEFAULT 'ru',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_telegram_idx ON users(telegram_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- IDOR ownership tracking for consultations
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS owner_id TEXT;

-- M2: Order lifecycle fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,2) DEFAULT 0.15;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_amount   INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejected_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason   TEXT;

-- Extend orders status constraint to include rejected and reviewed
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('created','paid','accepted','rejected','in_progress','completed','cancelled','refunded','reviewed'));

-- M2: Payments table (replaces ad-hoc simulate flow as single source of truth)
-- Vendor schedule slots
CREATE TABLE IF NOT EXISTS vendor_slots (
  id        SERIAL PRIMARY KEY,
  vet_id    INTEGER REFERENCES vets(id) ON DELETE CASCADE,
  slot_at   TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  order_id  UUID,
  UNIQUE(vet_id, slot_at)
);
CREATE INDEX IF NOT EXISTS vendor_slots_vet_idx ON vendor_slots(vet_id);

-- Client reviews for completed consultations
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  owner_id   TEXT NOT NULL,
  vet_id     INTEGER REFERENCES vets(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       TEXT,
  reply      TEXT,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','hidden')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_vet_idx    ON reviews(vet_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);

CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL CHECK (provider IN ('click','payme','uzum','simulate')),
  amount_uzs   INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','refunded','failed')),
  external_ref TEXT,
  checkout_url TEXT,
  paid_at      TIMESTAMPTZ,
  refunded_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payments_order_idx  ON payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE UNIQUE INDEX IF NOT EXISTS payments_external_ref_idx ON payments(external_ref) WHERE external_ref IS NOT NULL;

-- Vendor payout requests (vendors request withdrawal of their earnings)
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id           SERIAL PRIMARY KEY,
  vet_id       INTEGER REFERENCES vets(id) ON DELETE CASCADE,
  amount_uzs   INTEGER NOT NULL,
  method       TEXT NOT NULL DEFAULT 'click' CHECK (method IN ('click','payme','uzum')),
  requisites   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note   TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES admin_users(id)
);
CREATE INDEX IF NOT EXISTS vendor_payouts_vet_idx    ON vendor_payouts(vet_id);
CREATE INDEX IF NOT EXISTS vendor_payouts_status_idx ON vendor_payouts(status);

-- Platform-wide settings (commission rates, enabled payment providers, etc.)
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client dispute reports for completed/paid consultations
CREATE TABLE IF NOT EXISTS disputes (
  id              SERIAL PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  owner_id        TEXT NOT NULL,
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','resolved','closed')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultation_id, owner_id)
);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON disputes(status);

ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_by TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS dispute_messages (
  id         SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL CHECK (sender IN ('admin','system')),
  sender_name TEXT,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dispute_messages_dispute_idx ON dispute_messages(dispute_id);

-- Pet-friendly places directory
CREATE TABLE IF NOT EXISTS places (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('park','cafe','shop','grooming','hotel','clinic','other')),
  name_ru      TEXT NOT NULL,
  name_uz      TEXT NOT NULL DEFAULT '',
  address_ru   TEXT NOT NULL DEFAULT '',
  address_uz   TEXT NOT NULL DEFAULT '',
  desc_ru      TEXT DEFAULT '',
  desc_uz      TEXT DEFAULT '',
  emoji        TEXT NOT NULL DEFAULT '📍',
  color        TEXT NOT NULL DEFAULT '#E8911A',
  rating       NUMERIC(3,1) DEFAULT 4.5,
  reviews_cnt  INTEGER DEFAULT 0,
  pets_allowed TEXT[] DEFAULT '{}',
  working_hours TEXT DEFAULT '',
  phone        TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  is_active    BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS places_type_idx ON places(type);

-- M1: Pet passport, chip, colour, documents
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color            TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS sterilized       BOOLEAN;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip_number TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passport_number  TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passport_type    TEXT DEFAULT 'none';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_passport_type_check;
ALTER TABLE pets ADD CONSTRAINT pets_passport_type_check
  CHECK (passport_type IN ('eu','intl','none'));

CREATE UNIQUE INDEX IF NOT EXISTS pets_microchip_uidx
  ON pets(microchip_number) WHERE microchip_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS pet_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id     UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'passport_page'
             CHECK (kind IN ('passport_page','vaccination','other')),
  file_url   TEXT NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pet_documents_pet_idx ON pet_documents(pet_id);

-- M2: Structured vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id           UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('rabies','dhppi','other')),
  name             TEXT,
  date_administered DATE NOT NULL,
  valid_until      DATE,
  vet_name         TEXT,
  document_id      UUID REFERENCES pet_documents(id),
  verified_by      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vaccinations_pet_idx ON vaccinations(pet_id);

-- health-record M1: unified health event timeline
CREATE TABLE IF NOT EXISTS health_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN
              ('vaccination','weight','consultation','prescription','reminder','note')),
  source      TEXT NOT NULL DEFAULT 'owner'
              CHECK (source IN ('owner','vet','system')),
  ref_table   TEXT,
  ref_id      TEXT,
  title       TEXT NOT NULL,
  note        TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS health_events_pet_time_idx
  ON health_events(pet_id, occurred_at DESC);

-- M2: link consultation back to the triggering health event (optional)
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS reason_event_id UUID
  REFERENCES health_events(id) ON DELETE SET NULL;
