import { t } from './i18n'
import { withBase } from './paths'

const DISMISS_KEY = 'webtool.pwa.dismissed'
const NEVER_KEY = 'webtool.pwa.never'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ── Detection helpers ────────────────────────────────────────────────────────

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|opios/i.test(ua)
  return isIos && isSafari
}

function shouldSuppress(): boolean {
  try {
    if (localStorage.getItem(NEVER_KEY)) return true
    const ts = localStorage.getItem(DISMISS_KEY)
    if (ts && Date.now() - Number(ts) < COOLDOWN_MS) return true
  } catch {}
  return false
}

function setDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
}

function setNeverShow() {
  try { localStorage.setItem(NEVER_KEY, '1') } catch {}
}

// ── Banner DOM ───────────────────────────────────────────────────────────────

function createBanner(ios: boolean): HTMLElement {
  const el = document.createElement('div')
  el.className = 'wt-pwa-banner'
  el.setAttribute('role', 'complementary')
  el.setAttribute('aria-label', t('pwa.installTitle'))

  const title = ios ? t('pwa.iosTitle') : t('pwa.installTitle')
  const desc  = ios ? t('pwa.iosDesc')  : t('pwa.installDesc')

  el.innerHTML = `
    <div class="wt-pwa-banner__body">
      <img class="wt-pwa-banner__icon" src="${withBase('icons/icon-192.png')}" alt="" width="36" height="36" />
      <div class="wt-pwa-banner__text">
        <span class="wt-pwa-banner__title">${esc(title)}</span>
        <span class="wt-pwa-banner__desc">${esc(desc)}</span>
      </div>
    </div>
    <div class="wt-pwa-banner__actions">
      ${ios ? '' : `<button class="wt-button wt-button--primary wt-pwa-banner__install" type="button">${esc(t('pwa.installBtn'))}</button>`}
      <button class="wt-button wt-button--ghost wt-pwa-banner__dismiss" type="button">${esc(t('pwa.dismiss'))}</button>
      <button class="wt-button wt-button--ghost wt-pwa-banner__never" type="button">${esc(t('pwa.neverShow'))}</button>
    </div>
  `
  return el
}

function showBanner(el: HTMLElement) {
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('is-visible'))
}

function hideBanner(el: HTMLElement) {
  el.classList.remove('is-visible')
  el.addEventListener('transitionend', () => el.remove(), { once: true })
}

// ── Public API ───────────────────────────────────────────────────────────────

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(withBase('sw.js')).catch(() => {})
  })
}

export function setupPwaInstallBanner() {
  if (isStandalone() || shouldSuppress()) return

  // iOS Safari: show static hint after a short delay
  if (isIosSafari()) {
    setTimeout(() => {
      if (shouldSuppress()) return
      const banner = createBanner(true)
      showBanner(banner)
      banner.querySelector('.wt-pwa-banner__dismiss')?.addEventListener('click', () => {
        setDismissed()
        hideBanner(banner)
      })
      banner.querySelector('.wt-pwa-banner__never')?.addEventListener('click', () => {
        setNeverShow()
        hideBanner(banner)
      })
    }, 3000)
    return
  }

  // Chrome / Edge / Android: listen for beforeinstallprompt
  if (!('BeforeInstallPromptEvent' in window) && !('onbeforeinstallprompt' in window)) return

  let deferredPrompt: { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null = null

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as unknown as typeof deferredPrompt

    if (shouldSuppress()) return

    const banner = createBanner(false)
    showBanner(banner)

    banner.querySelector('.wt-pwa-banner__install')?.addEventListener('click', async () => {
      hideBanner(banner)
      if (!deferredPrompt) return
      await deferredPrompt.prompt()
      deferredPrompt = null
    })

    banner.querySelector('.wt-pwa-banner__dismiss')?.addEventListener('click', () => {
      setDismissed()
      hideBanner(banner)
    })

    banner.querySelector('.wt-pwa-banner__never')?.addEventListener('click', () => {
      setNeverShow()
      hideBanner(banner)
    })
  })

  // Hide banner if user installs via browser UI
  window.addEventListener('appinstalled', () => {
    const existing = document.querySelector('.wt-pwa-banner')
    if (existing instanceof HTMLElement) hideBanner(existing)
  })
}

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}
