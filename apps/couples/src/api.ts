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

export const api = {
  vets: () => req<Vet[]>('/vets'),
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
}
