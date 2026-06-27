// Canonical domain types matching the DB schema.
// Apps may extend these with app-specific fields.

export type Pet = {
  id: string
  owner_id: string
  species: 'cat' | 'dog' | 'rabbit' | 'parrot' | 'hamster' | 'fish' | 'other'
  name: string
  breed: string | null
  sex: 'male' | 'female' | 'unknown'
  birth_date: string | null
  weight_kg: number | null
  notes: string | null
  avatar_emoji: string
  created_at: string
}

export type Medication = {
  name: string
  dose: string
  freq: string
  days: number
}

export type MedicalReport = {
  diagnosis: string
  medications: Medication[]
  steps: string[]
  followup: string
  restrictions?: string
}

export type Consultation = {
  id: string
  vet_id: number
  owner_id: string | null
  client_name: string
  pet_name: string
  pet_species: string
  problem: string
  status: 'pending' | 'active' | 'completed'
  summary: string | null
  report: MedicalReport | null
  created_at: string
  call_started_at: string | null
  duration_min: number
  pet_id: string | null
}

export type Order = {
  id: string
  owner_id: string
  service_type: string
  vet_id: number | null
  consultation_id: string | null
  status: string
  price_uzs: number | null
  provider: 'click' | 'payme' | 'uzum' | null
  commission_rate: number | null
  payout_amount: number | null
  rejected_reason: string | null
  cancel_reason: string | null
  created_at: string
}

export type Message = {
  id: number
  consultation_id: string
  sender: 'client' | 'vet'
  text: string
  created_at: string
}

export type Review = {
  id: number
  order_id: string | null
  owner_id: string
  vet_id: number
  rating: number
  text: string | null
  reply: string | null
  status: 'pending' | 'published' | 'hidden'
  created_at: string
}

export type Vet = {
  id: number
  name: string
  specialty: string
  bio: string | null
  price_uzs: number
  rating: number
  avatar_emoji: string
  experience_yr: number
  is_available: boolean
}

export type LearnStep = { id: number; text: string }

export type LearnItem = {
  id: number
  type: 'checklist' | 'guide' | 'article' | 'video' | 'course' | 'quiz'
  category: string
  title: string
  subtitle: string
  body: string | null
  steps: LearnStep[] | null
  species: string[]
  duration_min: number
  emoji: string
  created_at?: string
}

export type PromoCode = {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}
