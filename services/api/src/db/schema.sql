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
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS vendor_credentials (
  id         SERIAL PRIMARY KEY,
  vet_id     INTEGER UNIQUE REFERENCES vets(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
