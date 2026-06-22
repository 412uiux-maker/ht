const BASE = '/api'

export type Vet = {
  id: number
  name: string
  specialty: string
  bio: string
  price_uzs: number
  rating: number
  avatar_emoji: string
  experience_yr: number
  is_available: boolean
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

export type Pet = {
  id: string
  owner_id: string
  species: string
  name: string
  breed: string | null
  sex: string
  birth_date: string | null
  weight_kg: number | null
  notes: string | null
  avatar_emoji: string
  created_at: string
}

export type Message = {
  id: number
  consultation_id: string
  sender: 'client' | 'vet'
  text: string
  created_at: string
}

export type Consultation = {
  id: string
  vet_id: number
  client_name: string
  pet_name: string
  pet_species: string
  problem: string
  status: string
  summary: string | null
  report: MedicalReport | null
  created_at: string
}

const req = async <T>(path: string, opts?: RequestInit): Promise<T> => {
  const r = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) throw new Error(r.statusText)
  return r.json()
}

export type PaymentResult = {
  success: boolean
  order_id: string
  ref: string
  amount_uzs: number
  provider: string
}

export type PromoResult = {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
}

export const getOwnerId = () => {
  let id = localStorage.getItem('ht_owner_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('ht_owner_id', id) }
  return id
}

export const api = {
  vets: () => req<Vet[]>('/vets'),
  pets: (ownerId: string) => req<Pet[]>(`/pets?owner_id=${encodeURIComponent(ownerId)}`),
  createConsultation: (body: {
    vet_id: number
    client_name: string
    pet_name: string
    pet_species: string
    problem: string
  }) => req<Consultation>('/consultations', { method: 'POST', body: JSON.stringify(body) }),
  getConsultation: (id: string) =>
    req<{ consultation: Consultation; messages: Message[] }>(`/consultations/${id}`),
  sendMessage: (id: string, text: string) =>
    req<Message>(`/consultations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ sender: 'client', text }),
    }),
  simulatePayment: (consultation_id: string, provider: string, amount_uzs: number) =>
    req<PaymentResult>('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify({ consultation_id, provider, amount_uzs, owner_id: getOwnerId() }),
    }),
  validatePromo: (code: string) =>
    req<PromoResult>('/promos/validate', { method: 'POST', body: JSON.stringify({ code }) }),
  usePromo: (code: string) =>
    req<{ used: boolean }>('/promos/use', { method: 'POST', body: JSON.stringify({ code }) }),
}
