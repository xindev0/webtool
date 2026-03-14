import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
} from 'qr-code-styling'
import { t } from '../shared/i18n'
import { escapeHtml as esc, escapeAttr as escAttr } from '../shared/utils'

type ContentType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms'
type WifiSecurity = 'auto' | 'WEP' | 'WPA' | 'WPA2WPA3' | 'WPA3' | 'nopass'
                  | 'WPA-ENT' | 'WPA2-ENT' | 'WPA3-ENT'

const CONTENT_TYPES: ContentType[] = ['url', 'text', 'wifi', 'email', 'phone', 'sms']

export function renderQrCodeTool(container: HTMLElement) {
  let logoDataUrl: string | undefined
  let bgImageDataUrl: string | undefined
  let qrCode: QRCodeStyling | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let currentType: ContentType = 'url'

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${esc(t('qrCode.title'))}</h1>
      <p class="wt-muted">${esc(t('qrCode.desc'))}</p>
    </section>

    <section class="wt-section">
      <!-- Content type tabs -->
      <div class="wt-tabs" id="wt-qr-tabs" role="tablist">
        ${CONTENT_TYPES.map((type) => `
        <button class="wt-tab${type === 'url' ? ' is-active' : ''}"
          data-type="${type}" role="tab" aria-selected="${type === 'url'}"
          type="button">${esc(t('qrCode.type.' + type))}</button>
      `).join('')}
      </div>

      <!-- URL -->
      <div class="wt-form wt-form--mt wt-qr-pane" data-for="url">
        <label class="wt-label">${esc(t('qrCode.url.label'))}</label>
        <input type="url" class="wt-input" id="wt-qr-url"
          placeholder="${escAttr(t('qrCode.url.placeholder'))}" value="https://" />
      </div>

      <!-- Plain text -->
      <div class="wt-form wt-form--mt wt-qr-pane" data-for="text" hidden>
        <label class="wt-label">${esc(t('qrCode.text.label'))}</label>
        <textarea class="wt-textarea" id="wt-qr-text"
          placeholder="${escAttr(t('qrCode.text.placeholder'))}" rows="4"></textarea>
      </div>

      <!-- Email -->
      <div class="wt-form wt-form--mt wt-qr-pane" data-for="email" hidden>
        <label class="wt-label">${esc(t('qrCode.email.address'))}</label>
        <input type="email" class="wt-input" id="wt-qr-email-address"
          placeholder="user@example.com" />
        <label class="wt-label wt-label--mt">${esc(t('qrCode.email.subject'))}</label>
        <input type="text" class="wt-input" id="wt-qr-email-subject" />
        <label class="wt-label wt-label--mt">${esc(t('qrCode.email.body'))}</label>
        <textarea class="wt-textarea" id="wt-qr-email-body" rows="3"></textarea>
      </div>

      <!-- Phone -->
      <div class="wt-form wt-form--mt wt-qr-pane" data-for="phone" hidden>
        <label class="wt-label">${esc(t('qrCode.phone.label'))}</label>
        <input type="tel" class="wt-input" id="wt-qr-phone" placeholder="+1234567890" />
      </div>

      <!-- SMS -->
      <div class="wt-form wt-form--mt wt-qr-pane" data-for="sms" hidden>
        <label class="wt-label">${esc(t('qrCode.sms.phone'))}</label>
        <input type="tel" class="wt-input" id="wt-qr-sms-phone" placeholder="+1234567890" />
        <label class="wt-label wt-label--mt">${esc(t('qrCode.sms.message'))}</label>
        <textarea class="wt-textarea" id="wt-qr-sms-message" rows="3"></textarea>
      </div>

      <!-- Wi-Fi -->
      <div class="wt-qr-pane wt-form--mt" data-for="wifi" hidden>
        <div class="wt-qr-wifi-grid">

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.wifi.ssid'))}</label>
            <input type="text" class="wt-input" id="wt-qr-wifi-ssid"
              placeholder="${escAttr(t('qrCode.wifi.ssidPlaceholder'))}" />
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.wifi.security'))}</label>
            <select class="wt-select" id="wt-qr-wifi-security">
              <option value="auto">${esc(t('qrCode.wifi.security.auto'))}</option>
              <option value="nopass">${esc(t('qrCode.wifi.security.none'))}</option>
              <option value="WEP">WEP</option>
              <option value="WPA">WPA</option>
              <option value="WPA2WPA3">${esc(t('qrCode.wifi.security.wpa2wpa3'))}</option>
              <option value="WPA3">WPA3</option>
              <optgroup label="${escAttr(t('qrCode.wifi.enterprise'))}">
                <option value="WPA-ENT">WPA ${esc(t('qrCode.wifi.enterprise'))}</option>
                <option value="WPA2-ENT">WPA2 ${esc(t('qrCode.wifi.enterprise'))}</option>
                <option value="WPA3-ENT">WPA3 ${esc(t('qrCode.wifi.enterprise'))}</option>
              </optgroup>
            </select>
          </div>

          <div class="wt-form wt-qr-wifi-pw-row">
            <label class="wt-label">${esc(t('qrCode.wifi.password'))}</label>
            <div class="wt-input-row">
              <input type="password" class="wt-input" id="wt-qr-wifi-password" />
              <button class="wt-button wt-button--ghost wt-button--icon"
                type="button" id="wt-qr-wifi-pw-toggle"
                title="${escAttr(t('qrCode.wifi.showPassword'))}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <!-- EAP-only fields -->
          <div class="wt-form wt-qr-eap-field" hidden>
            <label class="wt-label">${esc(t('qrCode.wifi.eapMethod'))}</label>
            <select class="wt-select" id="wt-qr-wifi-eap-method">
              <option value="PEAP">PEAP</option>
              <option value="TLS">TLS</option>
              <option value="TTLS">TTLS</option>
              <option value="PWD">PWD</option>
              <option value="SIM">SIM</option>
              <option value="AKA">AKA</option>
              <option value="AKA-PRIME">AKA'</option>
            </select>
          </div>

          <div class="wt-form wt-qr-eap-field" hidden>
            <label class="wt-label">${esc(t('qrCode.wifi.identity'))}</label>
            <input type="text" class="wt-input" id="wt-qr-wifi-identity"
              placeholder="${escAttr(t('qrCode.wifi.identityPlaceholder'))}" />
          </div>

          <div class="wt-form wt-qr-eap-field" hidden>
            <label class="wt-label">${esc(t('qrCode.wifi.phase2'))}</label>
            <select class="wt-select" id="wt-qr-wifi-phase2">
              <option value="MSCHAPV2">MSCHAPV2</option>
              <option value="GTC">GTC</option>
              <option value="PAP">PAP</option>
              <option value="CHAP">CHAP</option>
              <option value="MSCHAP">MSCHAP</option>
              <option value="none">${esc(t('qrCode.wifi.phase2None'))}</option>
            </select>
          </div>

          <div class="wt-form wt-qr-eap-field" hidden>
            <label class="wt-label">${esc(t('qrCode.wifi.anonIdentity'))}</label>
            <input type="text" class="wt-input" id="wt-qr-wifi-anon-identity"
              placeholder="${escAttr(t('qrCode.wifi.anonIdentityPlaceholder'))}" />
          </div>

          <div class="wt-form wt-qr-wifi-full-row">
            <label class="wt-checkbox-label">
              <input type="checkbox" id="wt-qr-wifi-hidden" />
              <span>${esc(t('qrCode.wifi.hidden'))}</span>
            </label>
          </div>

        </div>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-qr-layout">

        <!-- Style controls -->
        <div class="wt-qr-controls">
          <h2 class="wt-section__title">${esc(t('qrCode.styleSettings'))}</h2>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.dotStyle'))}</label>
            <select class="wt-select" id="wt-qr-dot-style">
              <option value="square">${esc(t('qrCode.dotSquare'))}</option>
              <option value="dots">${esc(t('qrCode.dotDots'))}</option>
              <option value="rounded" selected>${esc(t('qrCode.dotRounded'))}</option>
              <option value="classy">${esc(t('qrCode.dotClassy'))}</option>
              <option value="classy-rounded">${esc(t('qrCode.dotClassyRounded'))}</option>
              <option value="extra-rounded">${esc(t('qrCode.dotExtraRounded'))}</option>
            </select>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.cornerSquareStyle'))}</label>
            <select class="wt-select" id="wt-qr-corner-square-style">
              <option value="square">${esc(t('qrCode.cornerSquare'))}</option>
              <option value="dot">${esc(t('qrCode.cornerDot'))}</option>
              <option value="extra-rounded" selected>${esc(t('qrCode.cornerExtraRounded'))}</option>
            </select>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.cornerDotStyle'))}</label>
            <select class="wt-select" id="wt-qr-corner-dot-style">
              <option value="square">${esc(t('qrCode.cornerDotSquare'))}</option>
              <option value="dot" selected>${esc(t('qrCode.cornerDotDot'))}</option>
            </select>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.fgColor'))}</label>
            <div class="wt-color-row">
              <input type="color" class="wt-color-input" id="wt-qr-fg-color" value="#000000" />
              <input type="text" class="wt-input wt-input--sm" id="wt-qr-fg-hex" value="#000000" maxlength="7" />
            </div>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.bgColor'))}</label>
            <div class="wt-color-row">
              <input type="color" class="wt-color-input" id="wt-qr-bg-color" value="#ffffff" />
              <input type="text" class="wt-input wt-input--sm" id="wt-qr-bg-hex" value="#ffffff" maxlength="7" />
            </div>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.bgImage'))}</label>
            <div class="wt-qr-logo-row">
              <button class="wt-button wt-button--ghost" type="button" id="wt-qr-bg-btn">${esc(t('qrCode.bgImageSelect'))}</button>
              <button class="wt-button wt-button--ghost" type="button" id="wt-qr-bg-clear" hidden>${esc(t('qrCode.bgImageClear'))}</button>
              <input type="file" id="wt-qr-bg-file" accept="image/*" hidden />
              <span class="wt-muted" id="wt-qr-bg-name"></span>
            </div>
            <div class="wt-help">${esc(t('qrCode.bgImageHint'))}</div>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.logo'))}</label>
            <div class="wt-qr-logo-row">
              <button class="wt-button wt-button--ghost" type="button" id="wt-qr-logo-btn">${esc(t('qrCode.logoSelect'))}</button>
              <button class="wt-button wt-button--ghost" type="button" id="wt-qr-logo-clear" hidden>${esc(t('qrCode.logoClear'))}</button>
              <input type="file" id="wt-qr-logo-file" accept="image/*" hidden />
              <span class="wt-muted" id="wt-qr-logo-name"></span>
            </div>
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.size'))}</label>
            <input type="number" class="wt-input wt-input--sm" id="wt-qr-size"
              value="300" min="100" max="2000" step="50" />
          </div>

          <div class="wt-form">
            <label class="wt-label">${esc(t('qrCode.errorCorrection'))}</label>
            <select class="wt-select" id="wt-qr-ec">
              <option value="L">L (7%)</option>
              <option value="M" selected>M (15%)</option>
              <option value="Q">Q (25%)</option>
              <option value="H">H (30%)</option>
            </select>
          </div>
        </div>

        <!-- Preview -->
        <div class="wt-qr-preview">
          <h2 class="wt-section__title">${esc(t('qrCode.preview'))}</h2>
          <div class="wt-qr-canvas-wrap" id="wt-qr-canvas-wrap"></div>
          <div class="wt-row wt-row--wrap wt-form__actions">
            <button class="wt-button wt-button--primary" type="button" id="wt-qr-download">${esc(t('qrCode.downloadPng'))}</button>
            <button class="wt-button wt-button--ghost" type="button" id="wt-qr-download-svg">${esc(t('qrCode.downloadSvg'))}</button>
          </div>
        </div>

      </div>
    </section>
  `

  // ── Element refs ──────────────────────────────────────────────────────────
  const tabs = container.querySelectorAll<HTMLButtonElement>('#wt-qr-tabs .wt-tab')
  const panes = container.querySelectorAll<HTMLElement>('.wt-qr-pane')

  const urlInput = container.querySelector<HTMLInputElement>('#wt-qr-url')!
  const textInput = container.querySelector<HTMLTextAreaElement>('#wt-qr-text')!
  const emailAddress = container.querySelector<HTMLInputElement>('#wt-qr-email-address')!
  const emailSubject = container.querySelector<HTMLInputElement>('#wt-qr-email-subject')!
  const emailBody = container.querySelector<HTMLTextAreaElement>('#wt-qr-email-body')!
  const phoneInput = container.querySelector<HTMLInputElement>('#wt-qr-phone')!
  const smsPh = container.querySelector<HTMLInputElement>('#wt-qr-sms-phone')!
  const smsMsg = container.querySelector<HTMLTextAreaElement>('#wt-qr-sms-message')!

  const wifiSsid = container.querySelector<HTMLInputElement>('#wt-qr-wifi-ssid')!
  const wifiSecurity = container.querySelector<HTMLSelectElement>('#wt-qr-wifi-security')!
  const wifiPassword = container.querySelector<HTMLInputElement>('#wt-qr-wifi-password')!
  const wifiPwToggle = container.querySelector<HTMLButtonElement>('#wt-qr-wifi-pw-toggle')!
  const wifiPwRow = container.querySelector<HTMLElement>('.wt-qr-wifi-pw-row')!
  const eapFields = container.querySelectorAll<HTMLElement>('.wt-qr-eap-field')
  const wifiEapMethod = container.querySelector<HTMLSelectElement>('#wt-qr-wifi-eap-method')!
  const wifiIdentity = container.querySelector<HTMLInputElement>('#wt-qr-wifi-identity')!
  const wifiPhase2 = container.querySelector<HTMLSelectElement>('#wt-qr-wifi-phase2')!
  const wifiAnonId = container.querySelector<HTMLInputElement>('#wt-qr-wifi-anon-identity')!
  const wifiHidden = container.querySelector<HTMLInputElement>('#wt-qr-wifi-hidden')!

  const dotStyleEl = container.querySelector<HTMLSelectElement>('#wt-qr-dot-style')!
  const cornerSquareStyleEl = container.querySelector<HTMLSelectElement>('#wt-qr-corner-square-style')!
  const cornerDotStyleEl = container.querySelector<HTMLSelectElement>('#wt-qr-corner-dot-style')!
  const fgColorEl = container.querySelector<HTMLInputElement>('#wt-qr-fg-color')!
  const fgHexEl = container.querySelector<HTMLInputElement>('#wt-qr-fg-hex')!
  const bgColorEl = container.querySelector<HTMLInputElement>('#wt-qr-bg-color')!
  const bgHexEl = container.querySelector<HTMLInputElement>('#wt-qr-bg-hex')!
  const bgBtn = container.querySelector<HTMLButtonElement>('#wt-qr-bg-btn')!
  const bgClear = container.querySelector<HTMLButtonElement>('#wt-qr-bg-clear')!
  const bgFile = container.querySelector<HTMLInputElement>('#wt-qr-bg-file')!
  const bgName = container.querySelector<HTMLSpanElement>('#wt-qr-bg-name')!
  const logoBtn = container.querySelector<HTMLButtonElement>('#wt-qr-logo-btn')!
  const logoClear = container.querySelector<HTMLButtonElement>('#wt-qr-logo-clear')!
  const logoFile = container.querySelector<HTMLInputElement>('#wt-qr-logo-file')!
  const logoName = container.querySelector<HTMLSpanElement>('#wt-qr-logo-name')!
  const sizeEl = container.querySelector<HTMLInputElement>('#wt-qr-size')!
  const ecEl = container.querySelector<HTMLSelectElement>('#wt-qr-ec')!
  const canvasWrap = container.querySelector<HTMLDivElement>('#wt-qr-canvas-wrap')!
  const downloadBtn = container.querySelector<HTMLButtonElement>('#wt-qr-download')!
  const downloadSvgBtn = container.querySelector<HTMLButtonElement>('#wt-qr-download-svg')!

  // ── Type switching ────────────────────────────────────────────────────────
  function switchType(type: ContentType) {
    currentType = type
    tabs.forEach((tab) => {
      const active = tab.dataset.type === type
      tab.classList.toggle('is-active', active)
      tab.setAttribute('aria-selected', String(active))
    })
    panes.forEach((pane) => {
      pane.hidden = pane.dataset.for !== type
    })
    scheduleRender()
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchType(tab.dataset.type as ContentType))
  })

  // ── Wi-Fi security mode ───────────────────────────────────────────────────
  function applyWifiSecurity(sec: WifiSecurity) {
    const isEap = sec === 'WPA-ENT' || sec === 'WPA2-ENT' || sec === 'WPA3-ENT'
    const noPass = sec === 'nopass'
    wifiPwRow.hidden = noPass
    eapFields.forEach((el) => { el.hidden = !isEap })
    scheduleRender()
  }

  wifiSecurity.addEventListener('change', () => {
    applyWifiSecurity(wifiSecurity.value as WifiSecurity)
  })

  // Password show/hide toggle
  wifiPwToggle.addEventListener('click', () => {
    const show = wifiPassword.type === 'password'
    wifiPassword.type = show ? 'text' : 'password'
  })

  // ── Data builders ─────────────────────────────────────────────────────────
  function buildData(): string {
    switch (currentType) {
      case 'url':
        return urlInput.value.trim() || 'https://'
      case 'text':
        return textInput.value
      case 'phone':
        return `tel:${phoneInput.value.trim()}`
      case 'sms': {
        const num = smsPh.value.trim()
        const msg = smsMsg.value
        return msg ? `smsto:${num}:${msg}` : `smsto:${num}`
      }
      case 'email': {
        const to = emailAddress.value.trim()
        const subject = emailSubject.value.trim()
        const body = emailBody.value.trim()
        const params: string[] = []
        if (subject) params.push('subject=' + encodeURIComponent(subject))
        if (body) params.push('body=' + encodeURIComponent(body))
        return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`
      }
      case 'wifi': {
        const sec = wifiSecurity.value as WifiSecurity
        const ssid = wifiEscape(wifiSsid.value)
        const pw = wifiEscape(wifiPassword.value)
        const hidden = wifiHidden.checked ? 'H:true;' : ''

        // No-password / open network
        if (sec === 'nopass') return `WIFI:T:nopass;S:${ssid};${hidden};`

        // Auto: infer type from whether a password was entered
        if (sec === 'auto') {
          if (!pw) return `WIFI:T:nopass;S:${ssid};${hidden};`
          return `WIFI:T:WPA;S:${ssid};P:${pw};${hidden};`
        }

        // Enterprise (EAP)
        const isEap = sec === 'WPA-ENT' || sec === 'WPA2-ENT' || sec === 'WPA3-ENT'
        if (isEap) {
          const qrType = sec === 'WPA3-ENT' ? 'SAE' : 'WPA'
          const eap = wifiEapMethod.value === 'AKA-PRIME' ? "AKA'" : wifiEapMethod.value
          const identity = wifiEscape(wifiIdentity.value)
          const phase2 = wifiPhase2.value === 'none' ? '' : wifiPhase2.value
          const anonId = wifiEscape(wifiAnonId.value)
          return [
            `WIFI:T:${qrType}`,
            `S:${ssid}`,
            `E:${eap}`,
            identity ? `A:${identity}` : '',
            `P:${pw}`,
            phase2 ? `PH2:${phase2}` : '',
            anonId ? `I:${anonId}` : '',
            hidden,
          ].filter(Boolean).join(';') + ';'
        }

        // Personal: WEP → WEP, WPA → WPA, WPA2WPA3 → WPA, WPA3 → SAE
        const qrTypeMap: Record<string, string> = {
          WEP: 'WEP', WPA: 'WPA', WPA2WPA3: 'WPA', WPA3: 'SAE',
        }
        const qrType = qrTypeMap[sec] ?? 'WPA'
        return `WIFI:T:${qrType};S:${ssid};P:${pw};${hidden};`
      }
    }
  }

  // ── QR rendering ──────────────────────────────────────────────────────────
  function getOptions() {
    const size = Math.max(100, Math.min(2000, parseInt(sizeEl.value, 10) || 300))
    return {
      width: size,
      height: size,
      data: buildData(),
      dotsOptions: {
        color: fgColorEl.value,
        type: dotStyleEl.value as DotType,
      },
      cornersSquareOptions: {
        color: fgColorEl.value,
        type: cornerSquareStyleEl.value as CornerSquareType,
      },
      cornersDotOptions: {
        color: fgColorEl.value,
        type: cornerDotStyleEl.value as CornerDotType,
      },
      backgroundOptions: { color: bgImageDataUrl ? 'rgba(0,0,0,0)' : bgColorEl.value },
      imageOptions: {
        crossOrigin: 'anonymous' as const,
        margin: 8,
        imageSize: 0.35,
      },
      image: logoDataUrl,
      qrOptions: {
        errorCorrectionLevel: ecEl.value as ErrorCorrectionLevel,
      },
    }
  }

  function renderQr() {
    const opts = getOptions()
    canvasWrap.innerHTML = ''
    qrCode = new QRCodeStyling(opts)
    qrCode.append(canvasWrap)
    applyPreviewBackground()
  }

  function applyPreviewBackground() {
    if (bgImageDataUrl) {
      canvasWrap.style.backgroundImage = `url("${bgImageDataUrl}")`
      canvasWrap.style.backgroundSize = 'cover'
      canvasWrap.style.backgroundPosition = 'center'
      canvasWrap.style.backgroundRepeat = 'no-repeat'
      return
    }

    canvasWrap.style.backgroundImage = ''
    canvasWrap.style.backgroundSize = ''
    canvasWrap.style.backgroundPosition = ''
    canvasWrap.style.backgroundRepeat = ''
  }

  function scheduleRender() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(renderQr, 150)
  }

  // ── Color pickers ─────────────────────────────────────────────────────────
  fgColorEl.addEventListener('input', () => { fgHexEl.value = fgColorEl.value; scheduleRender() })
  fgHexEl.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(fgHexEl.value)) { fgColorEl.value = fgHexEl.value; scheduleRender() }
  })
  bgColorEl.addEventListener('input', () => { bgHexEl.value = bgColorEl.value; scheduleRender() })
  bgHexEl.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(bgHexEl.value)) { bgColorEl.value = bgHexEl.value; scheduleRender() }
  })

  // ── Background image upload ───────────────────────────────────────────────
  bgBtn.addEventListener('click', () => bgFile.click())
  bgFile.addEventListener('change', () => {
    const file = bgFile.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      bgImageDataUrl = reader.result as string
      bgName.textContent = file.name
      bgClear.hidden = false
      renderQr()
    }
    reader.readAsDataURL(file)
  })
  bgClear.addEventListener('click', () => {
    bgImageDataUrl = undefined
    bgFile.value = ''
    bgName.textContent = ''
    bgClear.hidden = true
    renderQr()
  })

  // ── Logo upload ───────────────────────────────────────────────────────────
  logoBtn.addEventListener('click', () => logoFile.click())
  logoFile.addEventListener('change', () => {
    const file = logoFile.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      logoDataUrl = reader.result as string
      logoName.textContent = file.name
      logoClear.hidden = false
      ecEl.value = 'H'
      renderQr()
    }
    reader.readAsDataURL(file)
  })
  logoClear.addEventListener('click', () => {
    logoDataUrl = undefined
    logoFile.value = ''
    logoName.textContent = ''
    logoClear.hidden = true
    renderQr()
  })

  // ── Generic change listeners ──────────────────────────────────────────────
  const inputEls = [urlInput, textInput, emailAddress, emailSubject,
    emailBody, phoneInput, smsPh, smsMsg, wifiSsid, wifiPassword, wifiIdentity, wifiAnonId]
  inputEls.forEach((el) => el.addEventListener('input', scheduleRender))

  const selectEls = [dotStyleEl, cornerSquareStyleEl, cornerDotStyleEl,
    sizeEl, ecEl, wifiEapMethod, wifiPhase2]
  selectEls.forEach((el) => el.addEventListener('change', renderQr))

  wifiHidden.addEventListener('change', renderQr)

  // ── Downloads ─────────────────────────────────────────────────────────────
  downloadBtn.addEventListener('click', () => { void downloadPng() })
  downloadSvgBtn.addEventListener('click', () => qrCode?.download({ name: 'qrcode', extension: 'svg' }))

  async function downloadPng() {
    if (!qrCode) return
    if (!bgImageDataUrl) {
      qrCode.download({ name: 'qrcode', extension: 'png' })
      return
    }

    const size = Math.max(100, Math.min(2000, parseInt(sizeEl.value, 10) || 300))
    const raw = await qrCode.getRawData('png')
    if (!raw) {
      qrCode.download({ name: 'qrcode', extension: 'png' })
      return
    }

    try {
      const [qrImg, bgImg] = await Promise.all([loadImageFromBlob(raw), loadImageFromDataUrl(bgImageDataUrl)])
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        qrCode.download({ name: 'qrcode', extension: 'png' })
        return
      }

      // Draw background image in cover mode
      const scale = Math.max(size / bgImg.width, size / bgImg.height)
      const drawW = bgImg.width * scale
      const drawH = bgImg.height * scale
      const drawX = (size - drawW) / 2
      const drawY = (size - drawH) / 2

      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH)
      ctx.drawImage(qrImg, 0, 0, size, size)

      const mergedBlob = await canvasToBlob(canvas)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(mergedBlob)
      link.download = 'qrcode.png'
      link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch {
      qrCode.download({ name: 'qrcode', extension: 'png' })
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  renderQr()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Escape special characters for the Wi-Fi QR format (RFC-like escaping). */
function wifiEscape(str: string): string {
  return str.replace(/([\\;,"])/g, '\\$1')
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load data URL image'))
    img.src = dataUrl
  })
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load blob image'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}
