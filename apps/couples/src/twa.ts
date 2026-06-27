// Thin wrapper over window.Telegram.WebApp.
// Swap body for @twa-dev/sdk import once the package is installed.

const tg = () => (window as any).Telegram?.WebApp as TgWebApp | undefined

interface TgWebApp {
  ready(): void
  expand(): void
  close(): void
  colorScheme: 'light' | 'dark'
  openLink(url: string, opts?: { try_instant_view?: boolean }): void
  BackButton: {
    show(): void
    hide(): void
    onClick(fn: () => void): void
    offClick(fn: () => void): void
    isVisible: boolean
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
}

export const WebApp = {
  isAvailable: () => !!tg(),
  ready: () => tg()?.ready(),
  expand: () => tg()?.expand(),
  close: () => tg()?.close(),
  colorScheme: (): 'light' | 'dark' => tg()?.colorScheme ?? 'light',
  openLink: (url: string) => {
    const wa = tg()
    if (wa?.openLink) wa.openLink(url, { try_instant_view: false })
    else window.open(url, '_blank')
  },
  BackButton: {
    show: () => tg()?.BackButton.show(),
    hide: () => tg()?.BackButton.hide(),
    onClick: (fn: () => void) => tg()?.BackButton.onClick(fn),
    offClick: (fn: () => void) => tg()?.BackButton.offClick(fn),
  },
  haptic: {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') =>
      tg()?.HapticFeedback.impactOccurred(style),
    notify: (type: 'error' | 'success' | 'warning') =>
      tg()?.HapticFeedback.notificationOccurred(type),
    select: () => tg()?.HapticFeedback.selectionChanged(),
  },
}
