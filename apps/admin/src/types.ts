export type AdminRole = 'moderator' | 'support' | 'admin'

export interface AdminSession {
  id: string
  email: string
  name: string
  role: AdminRole
  token: string
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
  disputes_open: number
}

export interface AdminDispute {
  id: number
  reason: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
  owner_id: string
  client_name: string | null
  pet_name: string | null
  pet_species: string | null
  consultation_id: string | null
  vet_name: string | null
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

export interface LearnItem {
  id: number
  type: 'article' | 'guide' | 'checklist' | 'video' | 'course' | 'quiz'
  category: string
  title: string
  subtitle: string
  emoji: string
  author: string
  body: string
  duration_min: number
  is_published: boolean
  sort_order: number
  created_at: string
  views: number
  level?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
}

export interface Review {
  id: number
  owner_id: string
  vet_name: string | null
  vet_emoji: string | null
  rating: number
  text: string | null
  reply: string | null
  status: 'pending' | 'published' | 'hidden'
  created_at: string
}

export interface GoodDeed {
  id: number
  title: string
  subtitle: string
  description: string
  category: string
  goal_amount: number | null
  raised_amount: number
  participants_count: number
  emoji: string
  deadline: string | null
  status: 'active' | 'completed' | 'paused'
  sort_order: number
  created_at: string
}

export type AppUserRole = 'owner' | 'vendor' | 'admin' | 'moderator' | 'support'

export interface AppUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: AppUserRole
  created_at: string
  is_blocked: boolean
  orders_count: number
}

export interface FinanceTx {
  id: string
  amount_uzs: number
  commission: number
  status: 'pending' | 'paid' | 'refunded' | 'failed'
  provider: string
  date: string
  vendor_name: string | null
  service_type: string
}

export interface FinancePayout {
  id: number
  vet_id: number
  vendor_name: string | null
  amount_uzs: number
  method: 'click' | 'payme' | 'uzum'
  requisites: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  requested_at: string
  resolved_at: string | null
}

export interface FinanceStats {
  total_revenue: number
  total_commission: number
  month_revenue: number
  pending_payouts: number
  pending_count: number
}

export type PlatformSettings = Record<string, string>

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
