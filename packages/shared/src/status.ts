// Canonical order status definitions — single source of truth for all apps.
// Colors use raw hex (not CSS vars) for portability across vendor/admin/couples.

export type OrderStatus =
  | 'created' | 'paid' | 'accepted' | 'in_progress'
  | 'completed' | 'cancelled' | 'rejected' | 'refunded' | 'reviewed'

export type ConsultStatus = 'pending' | 'active' | 'completed'

// Valid transitions per service-spec §8.1
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created:     ['cancelled'],
  paid:        ['accepted', 'rejected', 'cancelled'],
  accepted:    ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   ['reviewed'],
  rejected:    ['refunded'],
  cancelled:   ['refunded'],
  reviewed:    [],
  refunded:    [],
}

export const canTransitionOrder = (from: OrderStatus, to: OrderStatus) =>
  (ORDER_TRANSITIONS[from] ?? []).includes(to)

// i18n labels
const ORDER_LABELS: Record<OrderStatus, { ru: string; uz: string }> = {
  created:     { ru: 'Создан',       uz: 'Yaratildi' },
  paid:        { ru: 'Оплачен',      uz: "To'landi" },
  accepted:    { ru: 'Принят',       uz: 'Qabul qilindi' },
  in_progress: { ru: 'Идёт',         uz: 'Davom etmoqda' },
  completed:   { ru: 'Завершён',     uz: 'Yakunlandi' },
  cancelled:   { ru: 'Отменён',      uz: 'Bekor qilindi' },
  rejected:    { ru: 'Отклонён',     uz: 'Rad etildi' },
  refunded:    { ru: 'Возврат',      uz: 'Qaytarildi' },
  reviewed:    { ru: 'Отзыв',        uz: 'Fikr berildi' },
}

const CONSULT_LABELS: Record<ConsultStatus, { ru: string; uz: string }> = {
  pending:   { ru: 'Ожидает',    uz: 'Kutilmoqda' },
  active:    { ru: 'Активна',    uz: 'Faol' },
  completed: { ru: 'Завершена',  uz: 'Yakunlandi' },
}

export const orderStatusLabel = (status: string, lang: 'ru' | 'uz' = 'ru'): string =>
  ORDER_LABELS[status as OrderStatus]?.[lang] ?? status

export const consultStatusLabel = (status: string, lang: 'ru' | 'uz' = 'ru'): string =>
  CONSULT_LABELS[status as ConsultStatus]?.[lang] ?? status

// Color tokens: { bg, color } for inline styles — based on HappyTails palette
export type StatusColor = { bg: string; color: string }

const ORDER_COLORS: Record<OrderStatus, StatusColor> = {
  created:     { bg: 'rgba(107,114,128,.1)',  color: '#4B5563' },  // gray
  paid:        { bg: 'rgba(59,130,246,.12)',  color: '#1D4ED8' },  // blue
  accepted:    { bg: 'rgba(245,166,35,.12)',  color: '#B45309' },  // amber
  in_progress: { bg: 'rgba(242,120,75,.12)',  color: '#C2440A' },  // coral
  completed:   { bg: 'rgba(76,175,125,.12)',  color: '#1A7A4A' },  // green
  cancelled:   { bg: 'rgba(239,68,68,.12)',   color: '#DC2626' },  // red
  rejected:    { bg: 'rgba(239,68,68,.12)',   color: '#DC2626' },  // red
  refunded:    { bg: 'rgba(107,114,128,.1)',  color: '#6B7280' },  // gray
  reviewed:    { bg: 'rgba(124,92,191,.12)',  color: '#5B21B6' },  // violet
}

const CONSULT_COLORS: Record<ConsultStatus, StatusColor> = {
  pending:   { bg: 'rgba(245,166,35,.12)',  color: '#B45309' },
  active:    { bg: 'rgba(76,175,125,.12)',  color: '#1A7A4A' },
  completed: { bg: 'rgba(107,114,128,.1)',  color: '#4B5563' },
}

export const orderStatusColor = (status: string): StatusColor =>
  ORDER_COLORS[status as OrderStatus] ?? { bg: 'rgba(107,114,128,.1)', color: '#4B5563' }

export const consultStatusColor = (status: string): StatusColor =>
  CONSULT_COLORS[status as ConsultStatus] ?? { bg: 'rgba(107,114,128,.1)', color: '#4B5563' }
