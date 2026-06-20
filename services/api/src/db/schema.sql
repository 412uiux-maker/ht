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
