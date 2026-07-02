import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
  color?: string
}

type P = IconProps

function base(size = 24, color = 'currentColor', rest: Omit<P, 'size' | 'color'>) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: color, ...rest }
}

// ── Navigation ────────────────────────────────────────────────────────────────

export function IconHome({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12.74 2.47a1.05 1.05 0 0 0-1.48 0L2.6 10.3c-.22.21-.35.5-.35.8V20.5A1.5 1.5 0 0 0 3.75 22H9a.5.5 0 0 0 .5-.5V16a2.5 2.5 0 0 1 5 0v5.5a.5.5 0 0 0 .5.5h5.25a1.5 1.5 0 0 0 1.5-1.5V11.1a1.1 1.1 0 0 0-.36-.8l-8.65-7.83Z" />
    </svg>
  )
}

export function IconChat({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3A2.5 2.5 0 0 0 2 5.5v9A2.5 2.5 0 0 0 4.5 17H7v3.5a.5.5 0 0 0 .85.36L12.21 17H19.5A2.5 2.5 0 0 0 22 14.5v-9A2.5 2.5 0 0 0 19.5 3h-15Z" />
    </svg>
  )
}

export function IconPaw({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <ellipse cx="6.5" cy="6.5" rx="2" ry="2.6" />
      <ellipse cx="11.5" cy="4.5" rx="2" ry="2.6" />
      <ellipse cx="16.5" cy="6.5" rx="2" ry="2.6" />
      <ellipse cx="19.5" cy="11" rx="2" ry="2.6" />
      <path d="M12 13c-2.5 0-6.5 1.6-6.5 5.5 0 2 1.7 3.5 3.8 3.5h5.4c2.1 0 3.8-1.5 3.8-3.5 0-3.9-4-5.5-6.5-5.5Z" />
    </svg>
  )
}

export function IconBook({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h13.5a.5.5 0 0 0 0-1H7.5A1.5 1.5 0 0 1 6 19.5V19h13.5a.5.5 0 0 0 .5-.5V5a3 3 0 0 0-3-3H6Z" />
    </svg>
  )
}

export function IconUser({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M3.5 21.5c0-4.4 3.8-8 8.5-8s8.5 3.6 8.5 8a.5.5 0 0 1-.5.5h-16a.5.5 0 0 1-.5-.5Z" />
    </svg>
  )
}

// ── Admin sidebar ─────────────────────────────────────────────────────────────

export function IconDashboard({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <rect x="2" y="2" width="9" height="9" rx="2.5" />
      <rect x="13" y="2" width="9" height="9" rx="2.5" />
      <rect x="2" y="13" width="9" height="9" rx="2.5" />
      <rect x="13" y="13" width="9" height="9" rx="2.5" />
    </svg>
  )
}

export function IconVerify({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.5 2a8.5 8.5 0 1 0 5.26 15.18l3.53 3.53a1.25 1.25 0 1 0 1.77-1.77l-3.53-3.53A8.5 8.5 0 0 0 10.5 2Zm-2.28 8.2a1 1 0 0 0-1.44 1.4l2.5 2.5a1 1 0 0 0 1.44 0l4-4a1 1 0 1 0-1.44-1.4L9.5 12.1l-1.28-1.9Z" />
    </svg>
  )
}

export function IconConsultation({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3A2.5 2.5 0 0 0 2 5.5v9A2.5 2.5 0 0 0 4.5 17H7v3.5a.5.5 0 0 0 .85.36L12.21 17H19.5A2.5 2.5 0 0 0 22 14.5v-9A2.5 2.5 0 0 0 19.5 3h-15ZM8 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5.5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  )
}

export function IconOrders({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 2A1.5 1.5 0 0 0 7 3.5H5.5A2.5 2.5 0 0 0 3 6v14.5A2.5 2.5 0 0 0 5.5 23h13a2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5H17A1.5 1.5 0 0 0 15.5 2h-7ZM9 12a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H9Z" />
    </svg>
  )
}

export function IconMoney({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2 7.5A2.5 2.5 0 0 1 4.5 5h15A2.5 2.5 0 0 1 22 7.5v9A2.5 2.5 0 0 1 19.5 19h-15A2.5 2.5 0 0 1 2 16.5v-9ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm15 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  )
}

export function IconUsers({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="8.5" cy="7.5" r="4" />
      <path d="M1 21c0-4.4 3.4-7.5 7.5-7.5S16 16.6 16 21a.5.5 0 0 1-.5.5h-14A.5.5 0 0 1 1 21Z" />
      <circle cx="17.5" cy="8" r="3.5" />
      <path d="M16 15.5c1.3 0 2.6.4 3.6 1 1.5.9 2.4 2.4 2.4 4a.5.5 0 0 1-.5.5h-5.5a.5.5 0 0 1-.5-.5v-4.6c.15-.24.32-.3.5-.4Z" />
    </svg>
  )
}

export function IconContent({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.83a2 2 0 0 0-.59-1.42l-4.82-4.82A2 2 0 0 0 13.17 2H6Zm2 9a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H8Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H8Zm5-13v4.5A1.5 1.5 0 0 0 14.5 8H19l-6-6Z" />
    </svg>
  )
}

export function IconLearning({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 3.5 1 9l11 5.5L23 9 12 3.5Z" />
      <path d="M5 11.1V17.5c0 2.2 3.1 4 7 4s7-1.8 7-4V11.1l-7 3.5-7-3.5Z" />
      <rect x="21.25" y="8.5" width="1.5" height="7.5" rx=".75" />
    </svg>
  )
}

export function IconPromo({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 6A2.5 2.5 0 0 1 4 3.5h16A2.5 2.5 0 0 1 22.5 6v12a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 18V6ZM9.5 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.8 1.3a1 1 0 0 1 1.42 0l1 1a1 1 0 0 1 0 1.42l-6 6a1 1 0 0 1-1.42 0l-1-1a1 1 0 0 1 0-1.42l6-6Zm-.8 6.7a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" />
    </svg>
  )
}

export function IconSettings({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.08 2.14a1.5 1.5 0 0 1 1.84 0l1.17.93c.4.32.93.4 1.37.26l1.44-.43a1.5 1.5 0 0 1 1.79 1.04l.4 1.46c.13.47.48.84.9.97l1.38.55a1.5 1.5 0 0 1 .76 2.1l-.7 1.33a1.5 1.5 0 0 0 0 1.3l.7 1.33a1.5 1.5 0 0 1-.76 2.1l-1.38.55a1.5 1.5 0 0 0-.9.97l-.4 1.46a1.5 1.5 0 0 1-1.79 1.04l-1.44-.43a1.5 1.5 0 0 0-1.37.26l-1.17.93a1.5 1.5 0 0 1-1.84 0l-1.17-.93a1.5 1.5 0 0 0-1.37-.26l-1.44.43a1.5 1.5 0 0 1-1.79-1.04l-.4-1.46a1.5 1.5 0 0 0-.9-.97l-1.38-.55a1.5 1.5 0 0 1-.76-2.1l.7-1.33a1.5 1.5 0 0 0 0-1.3l-.7-1.33a1.5 1.5 0 0 1 .76-2.1l1.38-.55c.42-.13.77-.5.9-.97l.4-1.46a1.5 1.5 0 0 1 1.79-1.04l1.44.43c.44.14.97.06 1.37-.26l1.17-.93ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  )
}

export function IconAudit({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.83a2 2 0 0 0-.59-1.42l-4.82-4.82A2 2 0 0 0 13.17 2H6Zm9.78 11.72a1 1 0 0 0-1.42-1.44L11 15.6l-1.36-1.36a1 1 0 0 0-1.42 1.42l2.07 2.07a1 1 0 0 0 1.42 0l3.07-4.01ZM13.5 2l6 6H15A1.5 1.5 0 0 1 13.5 6.5V2Z" />
    </svg>
  )
}

// ── Actions ───────────────────────────────────────────────────────────────────

export function IconPlus({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 4a1.5 1.5 0 0 1 1.5 1.5v5h5a1.5 1.5 0 1 1 0 3h-5v5a1.5 1.5 0 1 1-3 0v-5h-5a1.5 1.5 0 1 1 0-3h5v-5A1.5 1.5 0 0 1 12 4Z" />
    </svg>
  )
}

export function IconEdit({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21.7 5.3a2.4 2.4 0 0 0-3.4-3.4l-1.6 1.6 3.4 3.4 1.6-1.6ZM15.3 4.9 4.3 15.9 3 21l5.1-1.3L19.1 8.7 15.3 4.9Z" />
    </svg>
  )
}

export function IconTrash({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M8.5 2A1.5 1.5 0 0 0 7 3.5H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-2A1.5 1.5 0 0 0 15.5 2h-7ZM5.5 7.5 6.5 21A1.5 1.5 0 0 0 8 22.5h8A1.5 1.5 0 0 0 17.5 21l1-13.5h-13Zm5 3a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 10.5 10.5Zm3 0a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

export function IconSearch({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.5 2a8.5 8.5 0 1 0 5.26 15.18l3.53 3.53a1.25 1.25 0 1 0 1.77-1.77l-3.53-3.53A8.5 8.5 0 0 0 10.5 2Z" />
    </svg>
  )
}

export function IconFilter({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v1.6a1.5 1.5 0 0 1-.44 1.06L15 12.7V19a1 1 0 0 1-.55.89l-4 2A1 1 0 0 1 9 21V12.7L3.44 7.16A1.5 1.5 0 0 1 3 6.1V4.5Z" />
    </svg>
  )
}

export function IconClose({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M5.47 4.22a.88.88 0 0 0-1.25 1.25L10.75 12l-6.53 6.53a.88.88 0 0 0 1.25 1.25L12 13.25l6.53 6.53a.88.88 0 0 0 1.25-1.25L13.25 12l6.53-6.53a.88.88 0 0 0-1.25-1.25L12 10.75 5.47 4.22Z" />
    </svg>
  )
}

export function IconArrowLeft({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M10.28 5.22a.75.75 0 0 0-1.06 0l-6.5 6.5a.75.75 0 0 0 0 1.06l6.5 6.5a.75.75 0 1 0 1.06-1.06L5.56 12.75H21a.75.75 0 0 0 0-1.5H5.56l4.72-4.97a.75.75 0 0 0 0-1.06Z" />
    </svg>
  )
}

export function IconArrowRight({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M13.72 5.22a.75.75 0 0 1 1.06 0l6.5 6.5a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 1 1-1.06-1.06l4.72-4.97H3a.75.75 0 0 1 0-1.5h15.44l-4.72-4.97a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function IconCheck({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M20.53 5.47a.75.75 0 0 1 0 1.06l-11.5 11.5a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 1 1 1.06-1.06l4.47 4.47L19.47 5.47a.75.75 0 0 1 1.06 0Z" />
    </svg>
  )
}

export function IconUpload({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M11.47 3.22a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1-1.06 1.06L12.75 5.56V16a.75.75 0 0 1-1.5 0V5.56L7.53 9.28a.75.75 0 0 1-1.06-1.06l5-5Z" />
      <path d="M3.75 17.25a.75.75 0 0 1 .75.75v2a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V18a.75.75 0 0 1 1.5 0v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

export function IconDownload({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12.53 16.28a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 1 1 1.06-1.06l3.72 3.72V4a.75.75 0 0 1 1.5 0v9.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-5 5Z" />
      <path d="M3.75 17.25a.75.75 0 0 1 .75.75v2a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V18a.75.75 0 0 1 1.5 0v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

export function IconEye({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 4.5C7.3 4.5 3.2 7.9 1.25 12 3.2 16.1 7.3 19.5 12 19.5S20.8 16.1 22.75 12C20.8 7.9 16.7 4.5 12 4.5Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  )
}

export function IconEyeOff({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M2.28 3.22a.75.75 0 0 0-1.06 1.06L5.05 8.1A11.7 11.7 0 0 0 1.25 12 11.7 11.7 0 0 0 12 19.5c1.62 0 3.17-.36 4.56-1.01l3.16 3.29a.75.75 0 0 0 1.06-1.06L2.28 3.22Zm5.2 6.26 1.54 1.54a3.5 3.5 0 0 0 4.96 4.96l1.35 1.35A8.23 8.23 0 0 1 12 18c-3.8 0-7.1-2.5-8.75-6 .9-1.85 2.2-3.38 3.73-4.52ZM12 6c.9 0 1.78.13 2.62.36l-1.77 1.77A3.5 3.5 0 0 0 8.4 12.15L6.63 10.38A8.23 8.23 0 0 1 12 6Zm1.5 3.5a3.5 3.5 0 0 1 2 2L14 13a1.5 1.5 0 0 0-2-2l1.5-1.5Z" />
    </svg>
  )
}

export function IconSend({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3.48 2.08a.75.75 0 0 0-.98.98l2.53 7.44H13a.75.75 0 0 1 0 1.5H5.03l-2.53 7.44a.75.75 0 0 0 .98.98l18-9a.75.75 0 0 0 0-1.34l-18-9Z" />
    </svg>
  )
}

export function IconRefresh({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 4.5A7.5 7.5 0 0 0 5.13 8.5H7.5a.75.75 0 0 1 0 1.5h-4A.75.75 0 0 1 2.75 9V5a.75.75 0 0 1 1.5 0v2.43A9 9 0 0 1 12 3a9 9 0 0 1 9 9 .75.75 0 0 1-1.5 0A7.5 7.5 0 0 0 12 4.5ZM3.75 13.5a.75.75 0 0 1 .75.75A7.5 7.5 0 0 0 18.87 18H16.5a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-2.43A9 9 0 0 1 12 21a9 9 0 0 1-9-9 .75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

// ── Status / Feedback ─────────────────────────────────────────────────────────

export function IconStar({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M11.1 2.4a1 1 0 0 1 1.8 0l2.34 4.74 5.23.76a1 1 0 0 1 .56 1.7l-3.79 3.7.9 5.22a1 1 0 0 1-1.45 1.05L12 17.07l-4.69 2.47a1 1 0 0 1-1.45-1.05l.9-5.23-3.79-3.7a1 1 0 0 1 .56-1.7l5.23-.75L11.1 2.4Z" />
    </svg>
  )
}

export function IconStarFilled({ size, color, ...r }: P) {
  return <IconStar size={size} color={color} {...r} />
}

export function IconHeart({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 20.7a1 1 0 0 1-.7-.3l-7.3-7.3A5.5 5.5 0 0 1 12 5.12a5.5 5.5 0 0 1 8 7.98l-7.3 7.3a1 1 0 0 1-.7.3Z" />
    </svg>
  )
}

export function IconHeartFilled({ size, color, ...r }: P) {
  return <IconHeart size={size} color={color} {...r} />
}

export function IconCheckCircle({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm4.78 7.72a.75.75 0 0 0-1.06-1.06L10.5 13.94l-2.22-2.22a.75.75 0 1 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.06 0l5.75-5.81Z" />
    </svg>
  )
}

export function IconAlertCircle({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5A.75.75 0 0 1 12 7Zm0 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  )
}

export function IconInfo({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM12 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-.75 4.25a.75.75 0 0 0 0 1.5h.75v3.5H11a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-.75v-4.25a.75.75 0 0 0-.75-.75h-.25Z" />
    </svg>
  )
}

export function IconClock({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm.75 5a.75.75 0 0 0-1.5 0v5.69c0 .2.08.38.22.52l3.5 3.5a.75.75 0 1 0 1.06-1.06L12.75 12.4V7Z" />
    </svg>
  )
}

export function IconBell({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M12 2a7 7 0 0 0-7 7v4.59l-1.7 2.55A1.5 1.5 0 0 0 4.55 18.5h14.9a1.5 1.5 0 0 0 1.25-2.36L19 13.59V9a7 7 0 0 0-7-7Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0h-4Z" />
    </svg>
  )
}

// ── Domain — veterinary / pets ────────────────────────────────────────────────

export function IconStethoscope({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8 3a2 2 0 0 0-2 2v5a6 6 0 0 0 5.25 5.95V19a3 3 0 1 0 1.5 0v-3.05A6 6 0 0 0 18 10V5a2 2 0 0 0-2-2H8Zm.5 1.5H8a.5.5 0 0 0-.5.5v5a4.5 4.5 0 0 0 9 0V5a.5.5 0 0 0-.5-.5h-.5V7a.75.75 0 0 1-1.5 0V4.5H9V7a.75.75 0 0 1-1.5 0V4.5Zm3.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  )
}

export function IconShield({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.54 2.14a1 1 0 0 1 .92 0l8 4A1 1 0 0 1 21 7v5c0 5-4 8.5-9 9.9C7 20.5 3 17 3 12V7a1 1 0 0 1 .54-.86l8-4Zm4.24 7.64a.75.75 0 0 0-1.06-1.06L10.5 13.94l-2.22-2.22a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.06 0l4.75-5.75Z" />
    </svg>
  )
}

export function IconMapPin({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.35C8.23 19.26 4 14.4 4 10a8 8 0 0 1 16 0c0 4.4-4.23 9.26-7.54 12.35a.7.7 0 0 1-.92 0ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  )
}

export function IconPhone({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.66 2.1a2 2 0 0 0-2.05.53L3.77 4.5a3 3 0 0 0-.68 3.12A19.5 19.5 0 0 0 13.38 17.9a3 3 0 0 0 3.12-.68l1.87-1.86a2 2 0 0 0 .53-2.05l-.8-2.4a2 2 0 0 0-2.28-1.35l-1.85.37a.5.5 0 0 1-.52-.26l-1.8-3.6a.5.5 0 0 1 .1-.58l1.38-1.3a2 2 0 0 0 .42-2.27L12.7 2.88a2 2 0 0 0-1.9-1.2l-3.14.42Z" />
    </svg>
  )
}

export function IconSyringe({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M22 2.5a.75.75 0 0 0-1.06 0l-2.5 2.5-1.06-1.06a.75.75 0 0 0-1.06 1.06l.53.53-7.37 7.37-1.5-1.5a.75.75 0 0 0-1.06 1.06l.5.5-3 5.54-1.7 1.7a.75.75 0 1 0 1.06 1.06l1.7-1.7 5.54-3 .5.5a.75.75 0 0 0 1.06-1.06l-1.5-1.5 7.37-7.37.53.53a.75.75 0 0 0 1.06-1.06l-1.06-1.06 2.5-2.5A.75.75 0 0 0 22 2.5Z" />
    </svg>
  )
}

export function IconFood({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2.5 8.5A1.5 1.5 0 0 1 4 7h16a1.5 1.5 0 0 1 1.5 1.5v8A5 5 0 0 1 16.5 21.5h-9A5 5 0 0 1 2.5 16.5v-8ZM7 3.5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Z" />
    </svg>
  )
}

export function IconCamera({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M9.34 4a2 2 0 0 0-1.78 1.1L6.67 7H4.5A2.5 2.5 0 0 0 2 9.5v10A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-10A2.5 2.5 0 0 0 19.5 7h-2.17l-.9-1.9A2 2 0 0 0 14.66 4H9.34ZM12 18.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  )
}

export function IconCertificate({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v10a2.5 2.5 0 0 1-2.5 2.5H13v1.5h1.5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5H11V18H5.5A2.5 2.5 0 0 1 3 15.5v-10ZM7 7.5a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 7 7.5Zm.75 3.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" />
    </svg>
  )
}

// ── UI misc ───────────────────────────────────────────────────────────────────

export function IconChevronRight({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M9.22 5.47a.75.75 0 0 0 0 1.06L14.69 12l-5.47 5.47a.75.75 0 1 0 1.06 1.06l6-6a.75.75 0 0 0 0-1.06l-6-6a.75.75 0 0 0-1.06 0Z" />
    </svg>
  )
}

export function IconChevronDown({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M5.47 9.22a.75.75 0 0 1 1.06 0L12 14.69l5.47-5.47a.75.75 0 1 1 1.06 1.06l-6 6a.75.75 0 0 1-1.06 0l-6-6a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function IconChevronUp({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M18.53 14.78a.75.75 0 0 1-1.06 0L12 9.31l-5.47 5.47a.75.75 0 1 1-1.06-1.06l6-6a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06Z" />
    </svg>
  )
}

export function IconMoon({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M21.53 15.93a9 9 0 0 1-12.46-12.46 1 1 0 0 0-.87-1.6A11 11 0 1 0 23.13 16.8a1 1 0 0 0-1.6-.87Z" />
    </svg>
  )
}

export function IconSun({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 1 12 1.5Zm0 18a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 1 12 19.5Zm10.5-7.5a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 .75.75ZM4.25 12a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 .75.75Zm14.6-7.85a.75.75 0 0 1 0 1.06l-1.41 1.42a.75.75 0 0 1-1.07-1.07l1.42-1.41a.75.75 0 0 1 1.06 0ZM7.63 17.44a.75.75 0 0 1 0 1.06L6.22 19.91a.75.75 0 1 1-1.06-1.06l1.41-1.41a.75.75 0 0 1 1.06 0Zm11.28 2.47a.75.75 0 0 1-1.06 0L16.44 18.5a.75.75 0 0 1 1.06-1.06l1.41 1.41a.75.75 0 0 1 0 1.06ZM7.63 6.56a.75.75 0 0 1-1.06 0L5.16 5.15A.75.75 0 0 1 6.22 4.09l1.41 1.41a.75.75 0 0 1 0 1.06Z" />
    </svg>
  )
}

export function IconMenu({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 17.25Z" />
    </svg>
  )
}

export function IconExternalLink({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-7.97 7.97a.75.75 0 0 1-1.06-1.06L15.44 4.5h-2.19a.75.75 0 0 1-.75-.75Z" />
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h5a.75.75 0 0 1 0 1.5h-5A1 1 0 0 0 5.5 7.5v10A1 1 0 0 0 6.5 18.5h10a1 1 0 0 0 1-1v-5a.75.75 0 0 1 1.5 0v5a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 17.5v-10Z" />
    </svg>
  )
}

export function IconLogOut({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19H11a.75.75 0 0 0 0-1.5H7.5A1 1 0 0 1 6.5 16.5v-9A1 1 0 0 1 7.5 6.5H11a.75.75 0 0 0 0-1.5H7.5ZM15.47 8.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H10.5a.75.75 0 0 1 0-1.5h7.44l-2.47-2.47a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function IconTag({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.5 2.5H3a.5.5 0 0 0-.5.5v8.5a1 1 0 0 0 .29.71l9 9a1 1 0 0 0 1.42 0l7.5-7.5a1 1 0 0 0 0-1.42l-9-9A1 1 0 0 0 11.5 2.5ZM7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  )
}

export function IconPlay({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm14.73-1.21-6-4A1.5 1.5 0 0 0 8.5 8v8a1.5 1.5 0 0 0 2.23 1.31l6-4a1.5 1.5 0 0 0 0-2.52Z" />
    </svg>
  )
}

export function IconImage({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M2 6a2.5 2.5 0 0 1 2.5-2.5h15A2.5 2.5 0 0 1 22 6v12a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18V6Zm2 9.44V18a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-2.56l-3.97-3.97a1 1 0 0 0-1.42 0L11.08 15l-1.66-1.66a1 1 0 0 0-1.42 0L4 15.44ZM7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  )
}

export function IconCalendar({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 1.5A.75.75 0 0 0 7.75 2v1H6a3 3 0 0 0-3 3v13.5A2.5 2.5 0 0 0 5.5 22h13a2.5 2.5 0 0 0 2.5-2.5V6a3 3 0 0 0-3-3h-1.75V2a.75.75 0 0 0-1.5 0v1h-5V2A.75.75 0 0 0 8.5 1.5ZM4.5 9.5V6a1.5 1.5 0 0 1 1.5-1.5h1.25V6a.75.75 0 0 0 1.5 0V4.5h5V6a.75.75 0 0 0 1.5 0V4.5H17A1.5 1.5 0 0 1 18.5 6v3.5H4.5Zm0 1.5h14V19.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V11Z" />
    </svg>
  )
}

export function IconGlobe({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM8.5 11.5H3.56A8.51 8.51 0 0 1 8.4 4.88 14.2 14.2 0 0 0 7 11.5h1.5Zm-4.94 1.5h4.94A14.2 14.2 0 0 0 9.9 19.5a8.51 8.51 0 0 1-6.34-6.5Zm5.94-1.5H14.5A12.7 12.7 0 0 0 12 4.7a12.7 12.7 0 0 0-2.5 6.8Zm5 0h4.94a8.51 8.51 0 0 0-6.34-6.62 14.2 14.2 0 0 1 1.4 6.62ZM14.5 13h-5A12.7 12.7 0 0 0 12 19.3a12.7 12.7 0 0 0 2.5-6.3Zm1 0h4.94a8.51 8.51 0 0 1-6.34 6.5A14.2 14.2 0 0 0 15.5 13Z" />
    </svg>
  )
}

export function IconCopy({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7 4a2 2 0 0 1 2-2h8.5A2.5 2.5 0 0 1 20 4.5v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4Zm-2 3.5H4a2 2 0 0 0-2 2V21a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1H9a3.5 3.5 0 0 1-3.5-3.5V7.5H5Z" />
    </svg>
  )
}

export function IconSpinner({ size, color, ...r }: P) {
  const { style, ...rest } = r
  return (
    <svg
      {...base(size, color, rest)}
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{ animation: 'ht-spin 0.8s linear infinite', ...style }}
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeOpacity={0.25} />
      <path d="M21 12a9 9 0 0 0-2.6-6.3" />
    </svg>
  )
}

export function IconAnalytics({ size, color, ...r }: P) {
  return (
    <svg {...base(size, color, r)} fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4"  />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  )
}

// ── Generic wrapper ───────────────────────────────────────────────────────────

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
