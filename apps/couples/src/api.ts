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

export type LearnStep = { id: number; text: string }

export type LearnItem = {
  id: number
  type: 'checklist' | 'guide' | 'article'
  category: string
  title: string
  subtitle: string
  body: string | null
  steps: LearnStep[] | null
  species: string[]
}

export type Order = {
  id: string
  service_type: string
  consultation_id: string | null
  status: string
  price_uzs: number | null
  provider: string | null
  created_at: string
  problem: string | null
  pet_name: string | null
  pet_species: string | null
  consult_status: string | null
  vet_name: string | null
  vet_specialty: string | null
  vet_avatar: string | null
}

export type Deed = {
  id: number
  title: string
  subtitle: string
  description: string
  category: string
  goal_amount: number
  raised_amount: number
  participants_count: number
  emoji: string
  deadline: string
  status: string
  my_types: string[]
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
  learn: (ownerId: string) => req<LearnItem[]>(`/learn?owner_id=${encodeURIComponent(ownerId)}`),
  learnItem: (id: number, ownerId: string) => req<LearnItem>(`/learn/${id}?owner_id=${encodeURIComponent(ownerId)}`),
  deeds: (ownerId: string) => req<Deed[]>(`/deeds?owner_id=${encodeURIComponent(ownerId)}`),
  participateDeed: (id: number, type: 'donate' | 'volunteer' | 'share', amount?: number) =>
    req<{ ok: boolean }>(`/deeds/${id}/participate`, {
      method: 'POST',
      body: JSON.stringify({ owner_id: getOwnerId(), type, amount_uzs: amount }),
    }),
  createPet: (body: { owner_id: string; name: string; species: string; sex: string; avatar_emoji: string }) =>
    req<Pet>('/pets', { method: 'POST', body: JSON.stringify(body) }),
  updatePet: (id: string, body: { name: string; species: string; sex: string; avatar_emoji: string; breed?: string | null; birth_date?: string | null; weight_kg?: number | null; notes?: string | null }) =>
    req<Pet>(`/pets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePet: (id: string) => req<{ ok: boolean }>(`/pets/${id}`, { method: 'DELETE' }),
  orders: (ownerId: string) => req<Order[]>(`/orders?owner_id=${encodeURIComponent(ownerId)}`),
}
