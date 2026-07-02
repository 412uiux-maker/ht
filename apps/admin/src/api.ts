import type { AdminSession, VendorVerification, Order, AuditEntry, DashboardStats, ConsultationRow, PromoCode, LearnItem, Review, GoodDeed, AppUser, FinanceTx, FinancePayout, FinanceStats, PlatformSettings, AdminDispute, DisputeMessage, Analytics } from './types'

let _session: AdminSession | null = (() => {
  try { const s = localStorage.getItem('ht_admin'); return s ? JSON.parse(s) : null } catch { return null }
})()

let _onUnauthorized: (() => void) | null = null

export const setApiSession = (s: AdminSession | null) => { _session = s }
export const setUnauthorizedHandler = (fn: () => void) => { _onUnauthorized = fn }

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${_session?.token ?? ''}`,
})

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch('/api/admin' + path, { headers: authHeaders(), ...opts })
  if (r.status === 401) {
    localStorage.removeItem('ht_admin')
    _session = null
    _onUnauthorized?.()
    throw new Error('Сессия истекла. Войдите снова.')
  }
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

  getUsers: (params?: { q?: string; role?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q)    qs.set('q', params.q)
    if (params?.role) qs.set('role', params.role)
    if (params?.page) qs.set('page', String(params.page))
    return req<{ users: AppUser[]; total: number }>(`/users?${qs}`)
  },

  blockUser: (id: string, blocked: boolean) =>
    req<{ ok: boolean }>(`/users/${id}/block`, {
      method: 'POST', body: JSON.stringify({ blocked }),
    }),

  changeUserRole: (id: string, role: string) =>
    req<{ ok: boolean }>(`/users/${id}/role`, {
      method: 'POST', body: JSON.stringify({ role }),
    }),

  getFinanceStats: () =>
    req<FinanceStats>('/finance/stats'),

  getFinanceTransactions: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.page)  qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    return req<{ transactions: FinanceTx[]; total: number }>(`/finance/transactions?${qs}`)
  },

  getFinancePayouts: (status?: string) =>
    req<FinancePayout[]>(`/finance/payouts${status ? `?status=${status}` : ''}`),

  approvePayout: (id: number, admin_note?: string) =>
    req<FinancePayout>(`/finance/payouts/${id}/approve`, {
      method: 'POST', body: JSON.stringify({ admin_note }),
    }),

  rejectPayout: (id: number, reason: string) =>
    req<FinancePayout>(`/finance/payouts/${id}/reject`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }),

  getSettings: () =>
    req<PlatformSettings>('/settings'),

  updateSetting: (key: string, value: string) =>
    req<{ ok: boolean; key: string; value: string }>('/settings', {
      method: 'PUT', body: JSON.stringify({ key, value }),
    }),

  getAnalytics: (days = 30) =>
    req<Analytics>(`/analytics?days=${days}`),

  getDisputes: (status: string = 'open', page: number = 1) =>
    req<{ disputes: AdminDispute[]; total: number }>(`/disputes?status=${status}&page=${page}`),

  getDispute: (id: number) =>
    req<{ dispute: AdminDispute; messages: DisputeMessage[] }>(`/disputes/${id}`),

  sendDisputeMessage: (id: number, text: string) =>
    req<DisputeMessage>(`/disputes/${id}/messages`, {
      method: 'POST', body: JSON.stringify({ text }),
    }),

  resolveDispute: (id: number, status: 'resolved' | 'closed', resolution?: string) =>
    req<AdminDispute>(`/disputes/${id}/resolve`, {
      method: 'POST', body: JSON.stringify({ status, resolution }),
    }),

  getPlaces: () => req<unknown[]>('/places'),

  createPlace: (data: Record<string, unknown>) =>
    req<unknown>('/places', { method: 'POST', body: JSON.stringify(data) }),

  updatePlace: (id: string, data: Record<string, unknown>) =>
    req<unknown>(`/places/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deletePlace: (id: string) =>
    req<{ ok: boolean }>(`/places/${id}`, { method: 'DELETE' }),
}
