export type VendorSession = {
  vet_id: number
  name: string
  specialty: string
  bio: string
  price_uzs: number
  rating: number
  avatar_emoji: string
  experience_yr: number
  token: string
  verification_status?: 'pending' | 'verified' | 'rejected'
}

export type VendorService = {
  id: number
  vet_id: number
  title_ru: string
  title_uz: string
  category: string
  description: string
  price_uzs: number
  duration_min: number
  format: 'online' | 'offline'
  is_active: boolean
  sort_order: number
  created_at: string
}

export type VendorSlot = {
  id: number
  vet_id: number
  slot_at: string
  is_booked: boolean
  order_id: string | null
}

export type ConsultStatus = 'pending' | 'active' | 'completed'

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
  client_name: string
  pet_name: string
  pet_species: string
  problem: string
  status: ConsultStatus
  summary: string | null
  report: MedicalReport | null
  created_at: string
  call_started_at: string | null
  duration_min: number
  pet_id: string | null
}

export type Message = {
  id: number
  consultation_id: string
  sender: 'client' | 'vet'
  text: string
  created_at: string
}

export type Stats = {
  total: number
  active: number
  pending: number
  completed: number
  income: number
  rating: number
}

export type VendorReview = {
  id: number
  rating: number
  text: string | null
  reply: string | null
  status: string
  created_at: string
  client_name: string
  pet_name: string
}

export type FinanceTx = {
  id: string
  date: string
  type: 'consult' | 'refund'
  client: string
  amount: number
  status: string
}

export type FinanceData = {
  balance: number
  pending: number
  month_total: number
  transactions: FinanceTx[]
}

const VENDOR_KEY = 'ht_vendor'
export const getSession = (): VendorSession | null => {
  const s = localStorage.getItem(VENDOR_KEY)
  return s ? JSON.parse(s) : null
}
export const setSession = (data: VendorSession): void =>
  localStorage.setItem(VENDOR_KEY, JSON.stringify(data))
export const clearSession = (): void =>
  localStorage.removeItem(VENDOR_KEY)
