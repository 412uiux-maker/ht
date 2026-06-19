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
