import type { VendorSession, VendorService, Consultation, Message, Stats, MedicalReport } from './types'
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
    bio?: string; email?: string; price_uzs?: number; experience_yr?: number; avatar_emoji?: string
  }) =>
    req<VendorSession>('/api/vendor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  getMe: () =>
    req<VendorSession>('/api/vendor/me', { headers: authHeaders() }),

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
}
