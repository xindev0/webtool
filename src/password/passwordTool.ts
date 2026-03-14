import { t } from '../shared/i18n'
import { WORDLIST } from './wordlist'

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'random' | 'passphrase' | 'pin'
type SepType = 'digit' | 'symbol' | 'space' | 'dot' | 'random' | 'custom'
type CaseType = 'lower' | 'upper' | 'capitalize' | 'random'
type StrengthLevel = 'weak' | 'fair' | 'strong' | 'veryStrong'

// ── Character sets ─────────────────────────────────────────────────────────────

const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz'
const CHARSET_DIGITS = '0123456789'
const CHARSET_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/'
const SEP_SYMBOLS = '!@#-_=+.'

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function randInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function randFrom<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)]
}

function randInRange(min: number, max: number): number {
  return min + randInt(max - min + 1)
}

// ── Generators ────────────────────────────────────────────────────────────────

function generateRandom(
  length: number,
  upper: boolean, lower: boolean, digits: boolean, symbols: boolean,
): string {
  const charset = (upper ? CHARSET_UPPER : '') +
    (lower ? CHARSET_LOWER : '') +
    (digits ? CHARSET_DIGITS : '') +
    (symbols ? CHARSET_SYMBOLS : '')
  if (!charset) return ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => charset[n % charset.length]).join('')
}

function resolveSeparator(type: SepType, custom: string, randomPool?: SepType[]): string {
  switch (type) {
    case 'digit': return String(randInt(10))
    case 'symbol': return randFrom(SEP_SYMBOLS.split(''))
    case 'space': return ' '
    case 'dot': return '.'
    case 'custom': return custom || '-'
    case 'random': {
      const pool: SepType[] =
        (randomPool && randomPool.length)
          ? randomPool
          : ['digit', 'symbol', 'space', 'dot']
      const chosen = randFrom(pool)
      return resolveSeparator(chosen, custom, randomPool)
    }
  }
}

function applyCase(word: string, caseType: CaseType): string {
  const effective: CaseType = caseType === 'random'
    ? (randFrom(['lower', 'capitalize'] as const))
    : caseType
  switch (effective) {
    case 'lower': return word.toLowerCase()
    case 'upper': return word.toUpperCase()
    case 'capitalize': return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }
}

function generatePassphrase(
  wordCount: number,
  sepType: SepType,
  customSep: string,
  caseType: CaseType,
  randomPool?: SepType[],
): string {
  const words: string[] = []
  for (let i = 0; i < wordCount; i++) {
    words.push(applyCase(randFrom(WORDLIST), caseType))
  }
  // Build with per-gap separators (each gap gets its own random value)
  const parts: string[] = []
  for (let i = 0; i < words.length; i++) {
    parts.push(words[i])
    if (i < words.length - 1) parts.push(resolveSeparator(sepType, customSep, randomPool))
  }
  return parts.join('')
}

function generatePin(length: number): string {
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => String(n % 10)).join('')
}

// ── Strength ──────────────────────────────────────────────────────────────────

interface StrengthInfo {
  level: StrengthLevel
  entropy: number
  color: string
  pct: number
}

function calcStrengthRandom(length: number, charsetSize: number): number {
  return length * Math.log2(Math.max(charsetSize, 1))
}

function calcStrengthPassphrase(
  wordCount: number, sepType: SepType, caseType: CaseType, randomPoolSize?: number,
): number {
  let entropy = wordCount * Math.log2(WORDLIST.length)
  // separator entropy per gap
  const gaps = wordCount - 1
  if (sepType === 'digit') entropy += gaps * Math.log2(10)
  else if (sepType === 'symbol') entropy += gaps * Math.log2(SEP_SYMBOLS.length)
  else if (sepType === 'random') {
    const poolSize = randomPoolSize && randomPoolSize > 0 ? randomPoolSize : 4
    entropy += gaps * Math.log2(poolSize)
  }
  // case entropy: random adds ~1 bit per word
  if (caseType === 'random') entropy += wordCount * 1
  return entropy
}

function entropyToStrength(entropy: number): StrengthInfo {
  if (entropy < 40) return { level: 'weak',       color: '#ef4444', pct: 18,  entropy }
  if (entropy < 60) return { level: 'fair',       color: '#f97316', pct: 45,  entropy }
  if (entropy < 80) return { level: 'strong',     color: '#22c55e', pct: 72,  entropy }
  return              { level: 'veryStrong', color: '#6d7cff', pct: 100, entropy }
}

// ── Main render ────────────────────────────────────────────────────────────────

export function renderPasswordTool(container: HTMLElement) {
  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('tool.password.name'))}</h1>
      <p class="wt-muted">${escapeHtml(t('tool.password.desc'))}</p>
    </section>

    <!-- Mode selector -->
    <section class="wt-section">
      <div class="wt-tabs" id="pw-mode-tabs">
        <button class="wt-tab is-active" data-mode="random" type="button">${escapeHtml(t('password.modeRandom'))}</button>
        <button class="wt-tab" data-mode="passphrase" type="button">${escapeHtml(t('password.modePassphrase'))}</button>
        <button class="wt-tab" data-mode="pin" type="button">${escapeHtml(t('password.modePin'))}</button>
      </div>
    </section>

    <!-- Random settings -->
    <div id="pw-panel-random">
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.lengthSection'))}</h2>
        </div>
        <div class="wt-form">
          <div style="margin-bottom:12px">
            <label class="wt-chip" for="pw-random-toggle">
              <input type="checkbox" id="pw-random-toggle" />
              <span>${escapeHtml(t('password.randomLength'))}</span>
            </label>
          </div>
          <div id="pw-fixed-row" class="wt-row" style="align-items:center;gap:10px">
            <label class="wt-label" for="pw-length" style="margin:0;white-space:nowrap">${escapeHtml(t('password.length'))}</label>
            <input class="wt-input" id="pw-length" type="number" min="4" max="128" value="16" style="width:90px" />
            <span class="wt-muted" style="font-size:12px">4 – 128</span>
          </div>
          <div id="pw-range-row" style="display:none" class="wt-row" style="align-items:center;gap:10px;flex-wrap:wrap">
            <label class="wt-label" style="margin:0;white-space:nowrap">${escapeHtml(t('password.minLength'))}</label>
            <input class="wt-input" id="pw-min" type="number" min="4" max="128" value="12" style="width:90px" />
            <label class="wt-label" style="margin:0;white-space:nowrap">${escapeHtml(t('password.maxLength'))}</label>
            <input class="wt-input" id="pw-max" type="number" min="4" max="128" value="20" style="width:90px" />
            <span class="wt-muted" style="font-size:12px">4 – 128</span>
          </div>
          <div id="pw-range-error" class="wt-help" style="color:#ef4444;display:none">${escapeHtml(t('password.rangeError'))}</div>
        </div>
      </section>
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.charTypes'))}</h2>
        </div>
        <div class="wt-chips">
          ${renderCheckChip('pw-upper',   t('password.upper'),   true)}
          ${renderCheckChip('pw-lower',   t('password.lower'),   true)}
          ${renderCheckChip('pw-digits',  t('password.digits'),  true)}
          ${renderCheckChip('pw-symbols', t('password.symbols'), false)}
        </div>
        <div id="pw-type-error" class="wt-help" style="color:#ef4444;margin-top:8px;display:none">${escapeHtml(t('password.noCharType'))}</div>
      </section>
    </div>

    <!-- Passphrase settings -->
    <div id="pw-panel-passphrase" style="display:none">
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.wordCount'))}</h2>
        </div>
        <div class="wt-form">
          <div class="wt-row" style="align-items:center;gap:10px">
            <input class="wt-input" id="pw-word-count" type="number" min="2" max="10" value="4" style="width:90px" />
            <span class="wt-muted" style="font-size:12px">2 – 10</span>
          </div>
        </div>
      </section>
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.separator'))}</h2>
        </div>
        <div class="wt-chips" id="pw-sep-chips">
          ${renderRadioChip('pw-sep', 'digit',   t('password.sep.digit'),  false)}
          ${renderRadioChip('pw-sep', 'symbol',  t('password.sep.symbol'), false)}
          ${renderRadioChip('pw-sep', 'space',   t('password.sep.space'),  false)}
          ${renderRadioChip('pw-sep', 'dot',     t('password.sep.dot'),    false)}
          ${renderRadioChip('pw-sep', 'random',  t('password.sep.random'), true)}
          ${renderRadioChip('pw-sep', 'custom',  t('password.sep.custom'), false)}
        </div>
        <div id="pw-sep-custom-row" style="display:none;margin-top:10px">
          <input class="wt-input" id="pw-sep-custom" type="text" maxlength="8"
            placeholder="${escapeAttr(t('password.sep.customPlaceholder'))}" style="width:160px" />
        </div>
        <div id="pw-sep-random-row" style="display:none;margin-top:10px">
          <div class="wt-chips">
            ${renderCheckChip('pw-sep-rand-digit',  t('password.sep.digit'),  true)}
            ${renderCheckChip('pw-sep-rand-symbol', t('password.sep.symbol'), true)}
            ${renderCheckChip('pw-sep-rand-space',  t('password.sep.space'),  true)}
            ${renderCheckChip('pw-sep-rand-dot',    t('password.sep.dot'),    true)}
          </div>
        </div>
      </section>
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.caseLabel'))}</h2>
        </div>
        <div class="wt-chips" id="pw-case-chips">
          ${renderRadioChip('pw-case', 'lower',      t('password.case.lower'),      false)}
          ${renderRadioChip('pw-case', 'capitalize',  t('password.case.capitalize'), true)}
          ${renderRadioChip('pw-case', 'upper',       t('password.case.upper'),      false)}
          ${renderRadioChip('pw-case', 'random',      t('password.case.random'),     false)}
        </div>
      </section>
    </div>

    <!-- PIN settings -->
    <div id="pw-panel-pin" style="display:none">
      <section class="wt-section">
        <div class="wt-section__header">
          <h2 class="wt-section__title">${escapeHtml(t('password.pinLength'))}</h2>
        </div>
        <div class="wt-form">
          <div style="margin-bottom:12px">
            <label class="wt-chip" for="pw-pin-random-toggle">
              <input type="checkbox" id="pw-pin-random-toggle" />
              <span>${escapeHtml(t('password.randomLength'))}</span>
            </label>
          </div>
          <div id="pw-pin-fixed-row" class="wt-row" style="align-items:center;gap:10px">
            <label class="wt-label" for="pw-pin-length" style="margin:0;white-space:nowrap">${escapeHtml(t('password.length'))}</label>
            <input class="wt-input" id="pw-pin-length" type="number" min="4" max="16" value="6" style="width:90px" />
            <span class="wt-muted" style="font-size:12px">4 – 16</span>
          </div>
          <div id="pw-pin-range-row" style="display:none" class="wt-row" style="align-items:center;gap:10px;flex-wrap:wrap">
            <label class="wt-label" style="margin:0;white-space:nowrap">${escapeHtml(t('password.minLength'))}</label>
            <input class="wt-input" id="pw-pin-min" type="number" min="4" max="16" value="4" style="width:90px" />
            <label class="wt-label" style="margin:0;white-space:nowrap">${escapeHtml(t('password.maxLength'))}</label>
            <input class="wt-input" id="pw-pin-max" type="number" min="4" max="16" value="8" style="width:90px" />
            <span class="wt-muted" style="font-size:12px">4 – 16</span>
          </div>
          <div id="pw-pin-range-error" class="wt-help" style="color:#ef4444;display:none">${escapeHtml(t('password.rangeError'))}</div>
        </div>
      </section>
    </div>

    <!-- Generate button -->
    <section class="wt-section">
      <button class="wt-button wt-button--primary" id="pw-generate" type="button">${escapeHtml(t('password.generate'))}</button>
    </section>

    <!-- Result -->
    <section class="wt-section" id="pw-result-section" style="display:none">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('password.result'))}</h2>
        <span class="wt-muted" style="font-size:12px">${escapeHtml(t('password.resultHint'))}</span>
      </div>
      <div class="wt-form">
        <div class="wt-row" style="gap:8px">
          <input class="wt-input" id="pw-output" type="text"
            style="font-family:monospace;font-size:15px;letter-spacing:0.04em;flex:1" />
          <button class="wt-button wt-button--ghost" id="pw-copy" type="button">${escapeHtml(t('password.copy'))}</button>
          <button class="wt-button wt-button--ghost" id="pw-regen" type="button" title="${escapeAttr(t('password.regenerate'))}">↻</button>
        </div>
        <div id="pw-strength-wrap" style="margin-top:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="wt-muted" style="font-size:13px">${escapeHtml(t('password.strengthLabel'))}</span>
            <span id="pw-strength-label" style="font-size:13px;font-weight:600"></span>
          </div>
          <div style="height:6px;border-radius:4px;background:var(--wt-border);overflow:hidden">
            <div id="pw-strength-bar" style="height:100%;border-radius:4px;transition:width 0.3s,background 0.3s;width:0%"></div>
          </div>
          <div id="pw-entropy-hint" class="wt-muted" style="font-size:11px;margin-top:4px;text-align:right"></div>
        </div>
        <div id="pw-length-display" class="wt-muted" style="font-size:12px;margin-top:6px;text-align:right"></div>
      </div>
    </section>

    <!-- Security tips -->
    <section class="wt-section">
      <div class="wt-callout">
        <div class="wt-callout__title">${escapeHtml(t('password.tipsTitle'))}</div>
        <div class="wt-callout__body">
          <ul style="margin:4px 0 0;padding-left:18px;line-height:1.8">
            <li>${escapeHtml(t('password.tip1'))}</li>
            <li>${escapeHtml(t('password.tip2'))}</li>
            <li>${escapeHtml(t('password.tip3'))}</li>
            <li>${escapeHtml(t('password.tip4'))}</li>
          </ul>
        </div>
      </div>
    </section>
  `

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  const panelRandom     = container.querySelector<HTMLElement>('#pw-panel-random')!
  const panelPassphrase = container.querySelector<HTMLElement>('#pw-panel-passphrase')!
  const panelPin        = container.querySelector<HTMLElement>('#pw-panel-pin')!

  // Random panel
  const randomLengthToggle = container.querySelector<HTMLInputElement>('#pw-random-toggle')!
  const fixedRow           = container.querySelector<HTMLElement>('#pw-fixed-row')!
  const rangeRow           = container.querySelector<HTMLElement>('#pw-range-row')!
  const lengthInput        = container.querySelector<HTMLInputElement>('#pw-length')!
  const minInput           = container.querySelector<HTMLInputElement>('#pw-min')!
  const maxInput           = container.querySelector<HTMLInputElement>('#pw-max')!
  const rangeError         = container.querySelector<HTMLElement>('#pw-range-error')!
  const upperCb            = container.querySelector<HTMLInputElement>('#pw-upper')!
  const lowerCb            = container.querySelector<HTMLInputElement>('#pw-lower')!
  const digitsCb           = container.querySelector<HTMLInputElement>('#pw-digits')!
  const symbolsCb          = container.querySelector<HTMLInputElement>('#pw-symbols')!
  const typeError          = container.querySelector<HTMLElement>('#pw-type-error')!

  // PIN panel
  const pinRandomToggle = container.querySelector<HTMLInputElement>('#pw-pin-random-toggle')!
  const pinFixedRow     = container.querySelector<HTMLElement>('#pw-pin-fixed-row')!
  const pinRangeRow     = container.querySelector<HTMLElement>('#pw-pin-range-row')!
  const pinLengthInput  = container.querySelector<HTMLInputElement>('#pw-pin-length')!
  const pinMinInput     = container.querySelector<HTMLInputElement>('#pw-pin-min')!
  const pinMaxInput     = container.querySelector<HTMLInputElement>('#pw-pin-max')!
  const pinRangeError   = container.querySelector<HTMLElement>('#pw-pin-range-error')!

  // Passphrase panel
  const wordCountInput   = container.querySelector<HTMLInputElement>('#pw-word-count')!
  const sepCustomRow     = container.querySelector<HTMLElement>('#pw-sep-custom-row')!
  const sepCustomInput   = container.querySelector<HTMLInputElement>('#pw-sep-custom')!
  const sepRandomRow     = container.querySelector<HTMLElement>('#pw-sep-random-row')!
  const sepRandDigit     = container.querySelector<HTMLInputElement>('#pw-sep-rand-digit')!
  const sepRandSymbol    = container.querySelector<HTMLInputElement>('#pw-sep-rand-symbol')!
  const sepRandSpace     = container.querySelector<HTMLInputElement>('#pw-sep-rand-space')!
  const sepRandDot       = container.querySelector<HTMLInputElement>('#pw-sep-rand-dot')!

  // Result
  const generateBtn    = container.querySelector<HTMLButtonElement>('#pw-generate')!
  const resultSection  = container.querySelector<HTMLElement>('#pw-result-section')!
  const outputInput    = container.querySelector<HTMLInputElement>('#pw-output')!
  const copyBtn        = container.querySelector<HTMLButtonElement>('#pw-copy')!
  const regenBtn       = container.querySelector<HTMLButtonElement>('#pw-regen')!
  const strengthBar    = container.querySelector<HTMLElement>('#pw-strength-bar')!
  const strengthLabel  = container.querySelector<HTMLElement>('#pw-strength-label')!
  const entropyHint    = container.querySelector<HTMLElement>('#pw-entropy-hint')!
  const lengthDisplay  = container.querySelector<HTMLElement>('#pw-length-display')!

  // ── Mode switching ────────────────────────────────────────────────────────────
  let currentMode: Mode = 'random'

  function getMode(): Mode { return currentMode }

  const modeTabs = container.querySelectorAll<HTMLButtonElement>('#pw-mode-tabs .wt-tab')
  container.querySelector('#pw-mode-tabs')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.wt-tab')
    if (!btn?.dataset.mode) return
    currentMode = btn.dataset.mode as Mode
    modeTabs.forEach((tab) => tab.classList.toggle('is-active', tab === btn))
    panelRandom.style.display     = currentMode === 'random'     ? '' : 'none'
    panelPassphrase.style.display = currentMode === 'passphrase' ? '' : 'none'
    panelPin.style.display        = currentMode === 'pin'        ? '' : 'none'
  })

  // ── Length toggle (random mode) ───────────────────────────────────────────────
  randomLengthToggle.addEventListener('change', () => {
    const on = randomLengthToggle.checked
    fixedRow.style.display = on ? 'none' : ''
    rangeRow.style.display = on ? ''     : 'none'
    rangeError.style.display = 'none'
  })

  pinRandomToggle.addEventListener('change', () => {
    const on = pinRandomToggle.checked
    pinFixedRow.style.display = on ? 'none' : ''
    pinRangeRow.style.display = on ? ''     : 'none'
    pinRangeError.style.display = 'none'
  })

  // ── Custom separator show/hide ────────────────────────────────────────────────
  container.querySelector('#pw-sep-chips')!.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement
    if (input.type === 'radio') {
      sepCustomRow.style.display = input.value === 'custom' ? '' : 'none'
      sepRandomRow.style.display = input.value === 'random' ? '' : 'none'
    }
  })

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function selectedRadio(name: string): string {
    const el = container.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
    return el?.value ?? ''
  }

  function getRandLength(
    randomOn: boolean,
    fixedEl: HTMLInputElement,
    minEl: HTMLInputElement,
    maxEl: HTMLInputElement,
    absMin: number, absMax: number,
  ): number {
    if (randomOn) {
      const lo = Math.max(absMin, Math.min(absMax, parseInt(minEl.value) || absMin))
      const hi = Math.max(lo,     Math.min(absMax, parseInt(maxEl.value) || absMax))
      return randInRange(lo, hi)
    }
    return Math.max(absMin, Math.min(absMax, parseInt(fixedEl.value) || absMin))
  }

  function validateRandom(): boolean {
    if (!upperCb.checked && !lowerCb.checked && !digitsCb.checked && !symbolsCb.checked) {
      typeError.style.display = ''
      return false
    }
    typeError.style.display = 'none'
    if (randomLengthToggle.checked) {
      const lo = parseInt(minInput.value) || 0
      const hi = parseInt(maxInput.value) || 0
      if (lo > hi) { rangeError.style.display = ''; return false }
    }
    rangeError.style.display = 'none'
    return true
  }

  function validatePin(): boolean {
    if (pinRandomToggle.checked) {
      const lo = parseInt(pinMinInput.value) || 0
      const hi = parseInt(pinMaxInput.value) || 0
      if (lo > hi) { pinRangeError.style.display = ''; return false }
    }
    pinRangeError.style.display = 'none'
    return true
  }

  // ── Strength display ──────────────────────────────────────────────────────────
  function showStrength(info: StrengthInfo) {
    strengthBar.style.width      = `${info.pct}%`
    strengthBar.style.background = info.color
    strengthLabel.textContent    = t(`password.strength.${info.level}`)
    strengthLabel.style.color    = info.color
    entropyHint.textContent      = `~${Math.round(info.entropy)} bits`
  }

  // ── Generate ──────────────────────────────────────────────────────────────────
  function doGenerate() {
    const mode = getMode()
    let password = ''
    let strength: StrengthInfo

    if (mode === 'random') {
      if (!validateRandom()) return
      const length = getRandLength(
        randomLengthToggle.checked, lengthInput, minInput, maxInput, 4, 128,
      )
      const charset =
        (upperCb.checked   ? CHARSET_UPPER   : '') +
        (lowerCb.checked   ? CHARSET_LOWER   : '') +
        (digitsCb.checked  ? CHARSET_DIGITS  : '') +
        (symbolsCb.checked ? CHARSET_SYMBOLS : '')
      password = generateRandom(length, upperCb.checked, lowerCb.checked, digitsCb.checked, symbolsCb.checked)
      strength = entropyToStrength(calcStrengthRandom(length, charset.length))

    } else if (mode === 'passphrase') {
      const wc      = Math.max(2, Math.min(10, parseInt(wordCountInput.value) || 4))
      const sepType = (selectedRadio('pw-sep') || 'random') as SepType
      const caseType = (selectedRadio('pw-case') || 'capitalize') as CaseType
      const customSep = sepCustomInput.value
      let randomPool: SepType[] | undefined
      if (sepType === 'random') {
        const pool: SepType[] = []
        if (sepRandDigit.checked)  pool.push('digit')
        if (sepRandSymbol.checked) pool.push('symbol')
        if (sepRandSpace.checked)  pool.push('space')
        if (sepRandDot.checked)    pool.push('dot')
        if (!pool.length) {
          pool.push('digit', 'symbol', 'space', 'dot')
        }
        randomPool = pool
      }
      password = generatePassphrase(wc, sepType, customSep, caseType, randomPool)
      strength = entropyToStrength(calcStrengthPassphrase(wc, sepType, caseType, randomPool?.length))

    } else {
      // PIN
      if (!validatePin()) return
      const length = getRandLength(
        pinRandomToggle.checked, pinLengthInput, pinMinInput, pinMaxInput, 4, 16,
      )
      password = generatePin(length)
      strength = entropyToStrength(calcStrengthRandom(length, 10))
    }

    outputInput.value = password
    resultSection.style.display = ''
    showStrength(strength)
    lengthDisplay.textContent = password
      ? `${t('password.length')}: ${password.length}`
      : ''
    copyBtn.textContent = t('password.copy')
  }

  generateBtn.addEventListener('click', doGenerate)
  regenBtn.addEventListener('click', doGenerate)

  // ── Copy ──────────────────────────────────────────────────────────────────────
  copyBtn.addEventListener('click', async () => {
    const val = outputInput.value
    if (!val) return
    try { await navigator.clipboard.writeText(val) }
    catch { outputInput.select(); document.execCommand('copy') }
    copyBtn.textContent = t('password.copied')
    setTimeout(() => { copyBtn.textContent = t('password.copy') }, 1800)
  })
}

// ── Render helpers ─────────────────────────────────────────────────────────────

function renderRadioChip(name: string, value: string, label: string, checked: boolean): string {
  const id = `${name}-${value}`
  return `
    <label class="wt-chip" for="${escapeAttr(id)}">
      <input type="radio" id="${escapeAttr(id)}" name="${escapeAttr(name)}" value="${escapeAttr(value)}"
        ${checked ? 'checked' : ''} />
      <span>${escapeHtml(label)}</span>
    </label>`
}

function renderCheckChip(id: string, label: string, checked: boolean): string {
  return `
    <label class="wt-chip" for="${escapeAttr(id)}">
      <input type="checkbox" id="${escapeAttr(id)}" ${checked ? 'checked' : ''} />
      <span>${escapeHtml(label)}</span>
    </label>`
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function escapeAttr(input: string): string {
  return input.replaceAll('"', '&quot;')
}
