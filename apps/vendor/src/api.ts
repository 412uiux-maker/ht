import type { VendorSession, VendorService, VendorSlot, Consultation, Message, Stats, MedicalReport, FinanceData, VendorReview, VendorClient } from './types'
import { getSession } from './types'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getSession()?.token ?? ''}`,
})

export const api = {
  sendCode: (phone: string) =>
    req<{ sent: boolean; _dev_code?: string }>('/api/vendor/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    }),

  verifyCode: (phone: string, code: string) =>
    req<VendorSession>('/api/vendor/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    }),

  login: (email: string, password: string) =>
    req<VendorSession>('/api/vendor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }),

  stats: (_vet_id: number) =>
    req<Stats>('/api/vendor/stats', { headers: authHeaders() }),

  consultations: (_vet_id: number, status?: string) => {
    const q = status && status !== 'all' ? `?status=${status}` : ''
    return req<Consultation[]>(`/api/vendor/consultations${q}`, { headers: authHeaders() })
  },

  consultation: (id: string) =>
    req<{ consultation: Consultation; messages: Message[] }>(`/api/consultations/${id}`),

  sendMessage: (id: string, text: string) =>
    req<Message>(`/api/consultations/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'vet', text })
    }),

  accept: (id: string) =>
    req<Consultation>(`/api/consultations/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: 'active' })
    }),

  reject: (id: string, reason?: string) =>
    req<Consultation>(`/api/consultations/${id}/reject`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason })
    }),

  complete: (id: string, report: MedicalReport) =>
    req<Consultation>(`/api/consultations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', report })
    }),

  register: (data: {
    name: string; specialty: string; phone: string; password: string;
    bio?: string; email?: string; price_uzs?: number; experience_yr?: number; avatar_emoji?: string;
    personal_story?: string;
    education?: { institution: string; degree: string; year: string }[];
    science?: { title: string; year: string }[];
  }) =>
    req<VendorSession>('/api/vendor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  getMe: () =>
    req<VendorSession>('/api/vendor/me', { headers: authHeaders() }),

  updateProfile: (data: Pick<VendorSession, 'name' | 'specialty' | 'bio' | 'price_uzs' | 'experience_yr' | 'avatar_emoji' | 'personal_story' | 'education' | 'science'>) =>
    req<VendorSession>('/api/vendor/me', {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
    }),

  linkTelegram: (telegram_id: number) =>
    req<{ ok: boolean }>('/api/vendor/link-telegram', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ telegram_id }),
    }),

  services: () =>
    req<VendorService[]>('/api/vendor/services', { headers: authHeaders() }),

  createService: (data: Omit<VendorService, 'id' | 'vet_id' | 'sort_order' | 'created_at'>) =>
    req<VendorService>('/api/vendor/services', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  updateService: (id: number, data: Partial<Omit<VendorService, 'id' | 'vet_id' | 'created_at'>>) =>
    req<VendorService>(`/api/vendor/services/${id}`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  deleteService: (id: number) =>
    req<{ ok: boolean }>(`/api/vendor/services/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    }),

  slots: (week?: string) =>
    req<VendorSlot[]>(`/api/vendor/slots${week ? `?week=${week}` : ''}`, { headers: authHeaders() }),

  toggleSlot: (slot_at: string) =>
    req<{ action: 'added' | 'removed'; slot_at: string }>('/api/vendor/slots/toggle', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ slot_at }),
    }),

  financeHistory: () =>
    req<FinanceData>('/api/vendor/finance', { headers: authHeaders() }),

  getReviews: () =>
    req<VendorReview[]>('/api/vendor/reviews', { headers: authHeaders() }),

  replyToReview: (id: number, text: string) =>
    req<VendorReview>(`/api/vendor/reviews/${id}/reply`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ text }),
    }),

  requestPayout: (amount_uzs: number, method: string, requisites: string) =>
    req<{ id: number; status: string }>('/api/vendor/payouts', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ amount_uzs, method, requisites }),
    }),

  clients: () =>
    req<VendorClient[]>('/api/vendor/clients', { headers: authHeaders() }),
}
