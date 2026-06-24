import type { SVGProps } from 'react'

// ---------------------------------------------------------------------------
// Base types & helper
// ---------------------------------------------------------------------------

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  color?: string
}

type P = IconProps

function base(size = 24, color = 'currentColor', rest: Omit<P, 'size' | 'color'>) {
  return {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export function IconHome({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M2.5 9.5 12 3l9.5 6.5V21a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

export function IconChat({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  )
}

export function IconPaw({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="6.5" cy="7" r="1.75" />
      <circle cx="11.5" cy="5" r="1.75" />
      <circle cx="16.5" cy="7" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
      <path d="M12 13c-2 0-6 1.5-6 5 0 1.5 1.5 2 3 2h6c1.5 0 3-.5 3-2 0-3.5-4-5-6-5Z" />
    </svg>
  )
}

export function IconBook({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  )
}

export function IconUser({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Admin sidebar
// ---------------------------------------------------------------------------

export function IconDashboard({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconVerify({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="m8 11 2.5 2.5 4-4" />
    </svg>
  )
}

export function IconConsultation({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth={2.5} />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  )
}

export function IconOrders({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

export function IconMoney({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" strokeWidth={2.5} />
    </svg>
  )
}

export function IconUsers({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21.5 20c0-2.5-2-4.5-4.5-4.5" />
    </svg>
  )
}

export function IconContent({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  )
}

export function IconLearning({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5Z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </svg>
  )
}

export function IconPromo({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m7.5 7.5 9 9M7.5 7.5H12M7.5 7.5V12" />
      <path d="M3 6a3 3 0 0 0 3-3h12a3 3 0 0 0 3 3v12a3 3 0 0 0-3 3H6a3 3 0 0 0-3-3V6Z" />
    </svg>
  )
}

export function IconSettings({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.1 4.9A9 9 0 0 0 4.9 4.9M4.9 19.1A9 9 0 0 0 19.1 19.1" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  )
}

export function IconAudit({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function IconPlus({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconEdit({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  )
}

export function IconTrash({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function IconSearch({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function IconFilter({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />
    </svg>
  )
}

export function IconClose({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function IconArrowLeft({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconArrowRight({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconCheck({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function IconUpload({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5M12 3v12" />
    </svg>
  )
}

export function IconDownload({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </svg>
  )
}

export function IconEye({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconEyeOff({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M17.9 17.9A10 10 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 7 10 7a18 18 0 0 1-2.1 3M3 3l18 18" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function IconSend({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m22 2-11 11M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  )
}

export function IconRefresh({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Status / Feedback
// ---------------------------------------------------------------------------

export function IconStar({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8-5-4.9 6.9-1L12 2Z" />
    </svg>
  )
}

export function IconStarFilled({ size, color = 'currentColor', ...r }: P) {
  return (
    <svg {...base(size, color, r)} fill={color}>
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8-5-4.9 6.9-1L12 2Z" stroke="none" />
    </svg>
  )
}

export function IconHeart({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

export function IconHeartFilled({ size, color = 'currentColor', ...r }: P) {
  return (
    <svg {...base(size, color, r)} fill={color}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z" stroke="none" />
    </svg>
  )
}

export function IconCheckCircle({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function IconAlertCircle({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeWidth={2.5} />
    </svg>
  )
}

export function IconInfo({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeWidth={2.5} />
    </svg>
  )
}

export function IconClock({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function IconBell({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Domain — veterinary / pets
// ---------------------------------------------------------------------------

export function IconStethoscope({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}

export function IconShield({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function IconMapPin({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconPhone({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.6-3.1 20 20 0 0 1-6-6 20 20 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 2.8 2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5 13 13 0 0 0 2.8.7A2 2 0 0 1 22 16.9Z" />
    </svg>
  )
}

export function IconSyringe({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m18 2 4 4-4 4M14 6l-8 8" />
      <path d="m10 10-2 2 2 2-2 2 2 2-4 4-4-4" />
      <path d="M18 6 8 16" />
    </svg>
  )
}

export function IconFood({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" />
      <path d="M6 1v3M10 1v3M14 1v3" />
    </svg>
  )
}

export function IconCamera({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14.5 4Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

export function IconCertificate({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M7 7h10M7 11h4" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// UI misc
// ---------------------------------------------------------------------------

export function IconChevronRight({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function IconChevronDown({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconChevronUp({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

export function IconMoon({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}

export function IconSun({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function IconMenu({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  )
}

export function IconExternalLink({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" />
    </svg>
  )
}

export function IconLogOut({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconTag({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M20.6 11.3 12.7 3.4A2 2 0 0 0 11.3 3H6a2 2 0 0 0-2 2v5.3a2 2 0 0 0 .6 1.4l7.9 7.9a2 2 0 0 0 2.8 0l5.3-5.4a2 2 0 0 0 0-2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconPlay({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8l6 4-6 4V8Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconImage({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

export function IconCalendar({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconGlobe({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  )
}

export function IconCopy({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function IconSpinner({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)} style={{ animation: 'ht-spin 0.8s linear infinite', ...(r.style ?? {}) }}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeOpacity={0.3} />
      <path d="M21 12a9 9 0 0 0-2.6-6.3" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Convenience generic wrapper
// ---------------------------------------------------------------------------

const ICONS = {
  home: IconHome, chat: IconChat, paw: IconPaw, book: IconBook, user: IconUser,
  dashboard: IconDashboard, verify: IconVerify, consultation: IconConsultation,
  orders: IconOrders, money: IconMoney, users: IconUsers, content: IconContent,
  learning: IconLearning, promo: IconPromo, settings: IconSettings, audit: IconAudit,
  plus: IconPlus, edit: IconEdit, trash: IconTrash, search: IconSearch, filter: IconFilter,
  close: IconClose, 'arrow-left': IconArrowLeft, 'arrow-right': IconArrowRight,
  check: IconCheck, upload: IconUpload, download: IconDownload, eye: IconEye,
  'eye-off': IconEyeOff, send: IconSend, refresh: IconRefresh,
  star: IconStar, 'star-filled': IconStarFilled, heart: IconHeart,
  'heart-filled': IconHeartFilled, 'check-circle': IconCheckCircle,
  alert: IconAlertCircle, info: IconInfo, clock: IconClock, bell: IconBell,
  stethoscope: IconStethoscope, shield: IconShield, 'map-pin': IconMapPin,
  phone: IconPhone, syringe: IconSyringe, food: IconFood, camera: IconCamera,
  certificate: IconCertificate,
  'chevron-right': IconChevronRight, 'chevron-down': IconChevronDown,
  'chevron-up': IconChevronUp, moon: IconMoon, sun: IconSun, menu: IconMenu,
  'external-link': IconExternalLink, logout: IconLogOut, tag: IconTag, play: IconPlay,
  image: IconImage, calendar: IconCalendar, globe: IconGlobe, copy: IconCopy,
  spinner: IconSpinner,
}

export type IconName = keyof typeof ICONS

export interface IconComponentProps extends IconProps {
  name: IconName
}

export function Icon({ name, ...rest }: IconComponentProps) {
  const Component = ICONS[name]
  return Component ? <Component {...rest} /> : null
}
