import type { AdminSession, VendorVerification, Order, AuditEntry, DashboardStats, ConsultationRow, PromoCode, LearnItem, Review, GoodDeed } from './types'

let _session: AdminSession | null = (() => {
  try { const s = localStorage.getItem('ht_admin'); return s ? JSON.parse(s) : null } catch { return null }
})()

export const setApiSession = (s: AdminSession | null) => { _session = s }

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${_session?.token ?? ''}`,
})

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch('/api/admin' + path, { headers: authHeaders(), ...opts })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error((e as { error?: string }).error ?? r.statusText)
  }
  return r.json()
}

export const adminApi = {
  login: async (email: string, password: string): Promise<AdminSession> => {
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      throw new Error((e as { error?: string }).error ?? 'Ошибка входа')
    }
    return r.json()
  },

  getVendors: (status = 'pending') =>
    req<VendorVerification[]>(`/vendors?status=${status}`),

  verifyVendor: (id: number, action: 'approve' | 'reject', comment?: string) =>
    req(`/vendors/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    }),

  getOrders: (params: { status?: string; q?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.q) qs.set('q', params.q)
    if (params.page) qs.set('page', String(params.page))
    return req<{ orders: Order[]; total: number }>(`/orders?${qs}`)
  },

  refundOrder: (id: string, reason: string) =>
    req(`/orders/${id}/refund`, { method: 'POST', body: JSON.stringify({ reason }) }),

  getAudit: (params?: { action?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.action) qs.set('action', params.action)
    if (params?.page)   qs.set('page', String(params.page))
    return req<{ entries: AuditEntry[]; total: number }>(`/audit?${qs}`)
  },

  getStats: () => req<DashboardStats>('/stats'),

  getConsultations: (params: { status?: string; q?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.q)      qs.set('q', params.q)
    if (params.page)   qs.set('page', String(params.page))
    return req<{ consultations: ConsultationRow[]; total: number }>(`/consultations?${qs}`)
  },

  getPromos: () => req<PromoCode[]>('/promos'),

  createPromo: (body: { code: string; discount_type: string; discount_value: number; max_uses?: number; expires_at?: string }) =>
    req<PromoCode>('/promos', { method: 'POST', body: JSON.stringify(body) }),

  togglePromo: (id: number, is_active: boolean) =>
    req<PromoCode>(`/promos/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),

  getContent: (type?: string) =>
    req<LearnItem[]>(`/content${type ? `?type=${type}` : ''}`),

  createContent: (data: Omit<LearnItem, 'id' | 'created_at' | 'views'>) =>
    req<LearnItem>('/content', { method: 'POST', body: JSON.stringify(data) }),

  updateContent: (id: number, data: Omit<LearnItem, 'id' | 'created_at' | 'views'>) =>
    req<LearnItem>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteContent: (id: number) =>
    req<{ ok: boolean }>(`/content/${id}`, { method: 'DELETE' }),

  getReviews: (status?: string) =>
    req<Review[]>(`/reviews${status ? `?status=${status}` : ''}`),

  moderateReview: (id: number, action: 'publish' | 'hide') =>
    req<Review>(`/reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action }) }),

  getDeeds: () => req<GoodDeed[]>('/deeds'),

  createDeed: (data: Omit<GoodDeed, 'id' | 'raised_amount' | 'participants_count' | 'created_at'>) =>
    req<GoodDeed>('/deeds', { method: 'POST', body: JSON.stringify(data) }),

  updateDeed: (id: number, data: Omit<GoodDeed, 'id' | 'raised_amount' | 'participants_count' | 'created_at'>) =>
    req<GoodDeed>(`/deeds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDeed: (id: number) =>
    req<{ ok: boolean }>(`/deeds/${id}`, { method: 'DELETE' }),
}
