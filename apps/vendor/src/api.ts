import type { VendorSession, Consultation, Message, Stats } from './types'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

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

  stats: (vet_id: number) =>
    req<Stats>(`/api/vendor/stats?vet_id=${vet_id}`),

  consultations: (vet_id: number, status?: string) => {
    const q = status && status !== 'all' ? `&status=${status}` : ''
    return req<Consultation[]>(`/api/vendor/consultations?vet_id=${vet_id}${q}`)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' })
    }),

  complete: (id: string, summary: string) =>
    req<Consultation>(`/api/consultations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', summary })
    })
}
