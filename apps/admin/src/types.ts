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
