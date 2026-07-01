const BASE = '/api'

export const getJwt = () => localStorage.getItem('ht_jwt')
export const setJwt = (token: string) => localStorage.setItem('ht_jwt', token)

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export type Vet = {
  id: number
  name: string
  specialty: string
  bio: string
  price_uzs: number
  rating: number
  review_count: number
  avatar_emoji: string
  experience_yr: number
  is_available: boolean
  is_verified?: boolean
}

export type VetReview = {
  id: number
  rating: number
  text: string | null
  reply: string | null
  created_at: string
  client_name: string
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
  color?: string | null
  sterilized?: boolean | null
  microchip_number?: string | null
  passport_number?: string | null
  passport_type?: 'eu' | 'intl' | 'none' | null
}

export type PetDocument = {
  id: string
  pet_id: string
  kind: 'passport_page' | 'vaccination' | 'other'
  file_url: string
  caption: string | null
  created_at: string
}

export type Vaccination = {
  id: string
  pet_id: string
  type: 'rabies' | 'dhppi' | 'other'
  name: string | null
  date_administered: string
  valid_until: string | null
  vet_name: string | null
  document_id: string | null
  verified_by: string | null
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
  call_started_at: string | null
  duration_min: number
  pet_id: string | null
}

export type HealthEventType = 'vaccination' | 'weight' | 'consultation' | 'prescription' | 'reminder' | 'note'
export type HealthEventSource = 'owner' | 'vet' | 'system'

export type HealthEvent = {
  id: string
  pet_id: string
  type: HealthEventType
  source: HealthEventSource
  ref_table: string | null
  ref_id: string | null
  title: string
  note: string | null
  occurred_at: string
  created_at: string
}

export type PetConsultation = {
  id: string
  created_at: string
  status: string
  report: MedicalReport | null
  summary: string | null
  duration_min: number
  call_started_at: string | null
  vet_name: string
  specialty: string
  avatar_emoji: string
}

const req = async <T>(path: string, opts?: RequestInit): Promise<T> => {
  const jwt = getJwt()
  const r = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {}),
    },
    ...opts,
  })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new ApiError(r.status, body.error || r.statusText)
  }
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

export type LearnProgress = {
  status: 'started' | 'completed'
  checked_steps: number[]
}

export type LearnItem = {
  id: number
  type: 'checklist' | 'guide' | 'article'
  category: string
  title: string
  subtitle: string
  body: string | null
  steps: LearnStep[] | null
  species: string[]
  duration_min: number
  emoji: string
  progress: LearnProgress | null
}

export type Order = {
  id: string
  vet_id: number | null
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

export type ApiPlace = {
  id: string
  type: 'park' | 'cafe' | 'shop' | 'grooming' | 'hotel'
  nameRu: string
  nameUz: string
  addressRu: string
  addressUz: string
  descRu: string
  descUz: string
  emoji: string
  color: string
  rating: number
  reviews: number
  petsAllowed: string[]
  workingHours: string
  phone: string
  tags: string[]
}

export type FoodResult = {
  id: number
  name: string
  brand: string
  species: string[]
  life_stages: string[]
  health_tags: string[] | null
  price_uzs: number
  budget_tier: string
  avatar_emoji: string
  description: string | null
  rating: string
  score: number
  match: number
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
  authTelegram: (initData: string) =>
    req<{ token: string; user: { id: string; name: string; locale: string } }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),

  vets: () => req<Vet[]>('/vets'),
  pets: (ownerId: string) => req<Pet[]>(`/pets?owner_id=${encodeURIComponent(ownerId)}`),
  createConsultation: (body: {
    vet_id: number
    client_name: string
    pet_name: string
    pet_species: string
    problem: string
    pet_id?: string
    reason_event_id?: string
  }) => req<Consultation>('/consultations', { method: 'POST', body: JSON.stringify(body) }),
  petConsultations: (petId: string) =>
    req<PetConsultation[]>(`/pets/${petId}/consultations`),
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
  learnProgress: (id: number, ownerId: string, status: 'started' | 'completed', checkedSteps: number[]) =>
    req<{ ok: boolean }>(`/learn/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify({ owner_id: ownerId, status, checked_steps: checkedSteps }),
    }),
  deeds: (ownerId: string) => req<Deed[]>(`/deeds?owner_id=${encodeURIComponent(ownerId)}`),
  participateDeed: (id: number, type: 'donate' | 'volunteer' | 'share', amount?: number) =>
    req<{ ok: boolean }>(`/deeds/${id}/participate`, {
      method: 'POST',
      body: JSON.stringify({ owner_id: getOwnerId(), type, amount_uzs: amount }),
    }),
  createPet: (body: {
    owner_id: string; name: string; species: string; sex: string; avatar_emoji: string;
    color?: string | null; sterilized?: boolean | null; microchip_number?: string | null;
    passport_number?: string | null; passport_type?: string | null;
  }) => req<Pet>('/pets', { method: 'POST', body: JSON.stringify(body) }),
  updatePet: (id: string, body: {
    name: string; species: string; sex: string; avatar_emoji: string;
    breed?: string | null; birth_date?: string | null; weight_kg?: number | null; notes?: string | null;
    color?: string | null; sterilized?: boolean | null; microchip_number?: string | null;
    passport_number?: string | null; passport_type?: string | null;
  }) => req<Pet>(`/pets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePet: (id: string) => req<void>(`/pets/${id}`, { method: 'DELETE' }),
  petDocuments: (petId: string, ownerId: string) =>
    req<PetDocument[]>(`/pets/${petId}/documents?owner_id=${encodeURIComponent(ownerId)}`),
  createPetDocument: (petId: string, body: { owner_id: string; kind: string; file_url: string; caption?: string }) =>
    req<PetDocument>(`/pets/${petId}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  deletePetDocument: (petId: string, docId: string, ownerId: string) =>
    req<void>(`/pets/${petId}/documents/${docId}?owner_id=${encodeURIComponent(ownerId)}`, { method: 'DELETE' }),
  petVaccinations: (petId: string, ownerId: string) =>
    req<Vaccination[]>(`/pets/${petId}/vaccinations?owner_id=${encodeURIComponent(ownerId)}`),
  createVaccination: (petId: string, body: {
    owner_id: string; type: string; name?: string; date_administered: string;
    valid_until?: string; vet_name?: string;
  }) => req<Vaccination>(`/pets/${petId}/vaccinations`, { method: 'POST', body: JSON.stringify(body) }),
  deleteVaccination: (petId: string, vaccId: string, ownerId: string) =>
    req<void>(`/pets/${petId}/vaccinations/${vaccId}?owner_id=${encodeURIComponent(ownerId)}`, { method: 'DELETE' }),
  petEvents: (petId: string, ownerId: string, opts?: { type?: string; limit?: number }) => {
    const qs = new URLSearchParams({ owner_id: ownerId })
    if (opts?.type) qs.set('type', opts.type)
    if (opts?.limit) qs.set('limit', String(opts.limit))
    return req<HealthEvent[]>(`/pets/${petId}/events?${qs}`)
  },
  createPetEvent: (petId: string, body: { owner_id: string; type: 'note' | 'weight'; title: string; note?: string; occurred_at?: string }) =>
    req<HealthEvent>(`/pets/${petId}/events`, { method: 'POST', body: JSON.stringify(body) }),
  logPetWeight: (petId: string, body: { owner_id: string; value: number; measured_at?: string }) =>
    req<{ pet: Pet; event: HealthEvent }>(`/pets/${petId}/weight`, { method: 'POST', body: JSON.stringify(body) }),

  orders: (ownerId: string) => req<Order[]>(`/orders?owner_id=${encodeURIComponent(ownerId)}`),

  getOrder: (orderId: string) => req<Order>(`/orders/${orderId}`),

  createOrder: (consultation_id: string, owner_id: string) =>
    req<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ consultation_id, owner_id }),
    }),

  checkout: (order_id: string, provider: string) =>
    req<{ payment_id: string; checkout_url: string; amount_uzs: number; provider: string }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ order_id, provider }),
    }),

  places: () => req<ApiPlace[]>('/places'),

  foodsQuiz: (species: string, life_stage: string, health_tags: string[]) =>
    req<FoodResult[]>('/foods/quiz', {
      method: 'POST',
      body: JSON.stringify({ species, life_stage, health_tags }),
    }),

  vetReviews: (vetId: number) =>
    req<VetReview[]>(`/vets/${vetId}/reviews`),

  reviewConsultation: (id: string, rating: number, comment?: string) =>
    req<{ ok: boolean }>(`/consultations/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ owner_id: getOwnerId(), rating, comment }),
    }),

  disputeConsultation: (id: string, reason: string) =>
    req<{ ok: boolean }>(`/consultations/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ owner_id: getOwnerId(), reason }),
    }),
}
