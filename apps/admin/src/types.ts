export type AdminRole = 'moderator' | 'support' | 'admin'

export interface AdminSession {
  id: string
  email: string
  name: string
  role: AdminRole
}

export interface VendorVerification {
  id: number
  name: string
  specialty: string
  bio: string
  price_uzs: number
  rating: number
  avatar_emoji: string
  email: string
  verification_status: 'pending' | 'verified' | 'rejected'
  comment: string | null
  submitted_at: string
}

export interface Order {
  id: string
  owner_id: string
  service_type: string
  status: string
  price_uzs: number | null
  provider: string | null
  created_at: string
  vet_name: string | null
  specialty: string | null
}

export interface AuditEntry {
  id: number
  actor_id: string
  actor_role: string
  actor_name: string
  action: string
  target_type: string
  target_id: string
  detail: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  revenue_total: number
  revenue_today: number
  consult_pending: number
  consult_active: number
  consult_completed: number
  vets_total: number
  vets_available: number
  verif_pending: number
  users_total: number
}

export interface ConsultationRow {
  id: string
  client_name: string
  pet_name: string
  pet_species: string
  problem: string
  status: string
  summary: string | null
  report: Record<string, unknown> | null
  created_at: string
  vet_name: string | null
  vet_emoji: string | null
}

export interface PromoCode {
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
