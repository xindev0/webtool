import { t } from '../shared/i18n'

type Mode = 'encode' | 'decode'

export function renderBase64Tool(container: HTMLElement) {
  let mode: Mode = 'encode'
  let lastFile: File | null = null
  let decodeObjectUrl: string | null = null

  const updateUI = () => {
    const encodeSection = container.querySelector<HTMLElement>('#wt-base64-encode')
    const decodeSection = container.querySelector<HTMLElement>('#wt-base64-decode')
    const encodeTab = container.querySelector<HTMLElement>('[data-mode="encode"]')
    const decodeTab = container.querySelector<HTMLElement>('[data-mode="decode"]')
    if (!encodeSection || !decodeSection || !encodeTab || !decodeTab) return

    encodeSection.hidden = mode !== 'encode'
    decodeSection.hidden = mode !== 'decode'
    encodeTab.classList.toggle('is-active', mode === 'encode')
    decodeTab.classList.toggle('is-active', mode === 'decode')
  }

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('base64.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('base64.desc'))}</p>
    </section>

    <section class="wt-section">
      <div class="wt-tabs" role="tablist">
        <button class="wt-tab is-active" type="button" role="tab" data-mode="encode">${escapeHtml(t('base64.encode'))}</button>
        <button class="wt-tab" type="button" role="tab" data-mode="decode">${escapeHtml(t('base64.decode'))}</button>
      </div>
    </section>

    <section class="wt-section" id="wt-base64-encode">
      <div class="wt-form">
        <label class="wt-label">${escapeHtml(t('base64.encodeSource'))}</label>
        <div class="wt-base64-source">
          <div class="wt-base64-filezone" id="wt-base64-filezone">
            <input type="file" id="wt-base64-file" class="wt-base64-file-input" accept="image/*,audio/*,video/*,text/*,*/*" />
            <p class="wt-base64-filezone-text">${escapeHtml(t('base64.dropFile'))}</p>
          </div>
          <div class="wt-base64-divider">${escapeHtml(t('base64.or'))}</div>
          <textarea class="wt-textarea" id="wt-base64-text-in" placeholder="${escapeAttr(t('base64.textPlaceholder'))}" rows="4"></textarea>
        </div>
      </div>
      <div class="wt-form wt-form--mt">
        <div class="wt-chips">
          <label class="wt-chip" for="wt-base64-dataurl">
            <input type="checkbox" id="wt-base64-dataurl" checked />
            <span>${escapeHtml(t('base64.includeDataUrl'))}</span>
          </label>
        </div>
      </div>
      <div class="wt-form">
        <label class="wt-label">${escapeHtml(t('base64.result'))}</label>
        <textarea class="wt-textarea wt-textarea--mono" id="wt-base64-output" readonly rows="6" placeholder="${escapeAttr(t('base64.resultPlaceholder'))}"></textarea>
        <div class="wt-row wt-row--wrap wt-form__actions">
          <button class="wt-button wt-button--primary" type="button" id="wt-base64-copy">${escapeHtml(t('base64.copy'))}</button>
        </div>
      </div>
    </section>

    <section class="wt-section" id="wt-base64-decode" hidden>
      <div class="wt-form">
        <label class="wt-label">${escapeHtml(t('base64.decodeInput'))}</label>
        <textarea class="wt-textarea wt-textarea--mono" id="wt-base64-decode-in" placeholder="${escapeAttr(t('base64.decodePlaceholder'))}" rows="6"></textarea>
      </div>
      <div class="wt-form">
        <button class="wt-button wt-button--primary" type="button" id="wt-base64-decode-btn">${escapeHtml(t('base64.decodeBtn'))}</button>
      </div>
      <div class="wt-form" id="wt-base64-decode-result">
        <label class="wt-label">${escapeHtml(t('base64.result'))}</label>
        <div id="wt-base64-decode-output" class="wt-base64-decode-output"></div>
      </div>
    </section>
  `

  const encodeTab = container.querySelector<HTMLElement>('[data-mode="encode"]')
  const decodeTab = container.querySelector<HTMLElement>('[data-mode="decode"]')
  const filezone = container.querySelector<HTMLElement>('#wt-base64-filezone')
  const fileInput = container.querySelector<HTMLInputElement>('#wt-base64-file')
  const textIn = container.querySelector<HTMLTextAreaElement>('#wt-base64-text-in')
  const dataUrlCheck = container.querySelector<HTMLInputElement>('#wt-base64-dataurl')
  const output = container.querySelector<HTMLTextAreaElement>('#wt-base64-output')
  const copyBtn = container.querySelector<HTMLButtonElement>('#wt-base64-copy')
  const decodeIn = container.querySelector<HTMLTextAreaElement>('#wt-base64-decode-in')
  const decodeBtn = container.querySelector<HTMLButtonElement>('#wt-base64-decode-btn')
  const decodeOutput = container.querySelector<HTMLDivElement>('#wt-base64-decode-output')

  if (!filezone || !fileInput || !textIn || !dataUrlCheck || !output || !copyBtn || !decodeIn || !decodeBtn || !decodeOutput) return

  const runEncode = () => {
    const includeDataUrl = dataUrlCheck.checked
    if (lastFile) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (result.startsWith('data:')) {
          output.value = includeDataUrl ? result : result.replace(/^data:[^;]+;base64,/, '')
        } else {
          output.value = btoa(result)
        }
      }
      reader.readAsDataURL(lastFile)
      return
    }
    const text = textIn.value
    if (!text) {
      output.value = ''
      return
    }
    try {
      const base64 = textToBase64(text)
      output.value = includeDataUrl ? `data:text/plain;base64,${base64}` : base64
    } catch {
      output.value = ''
    }
  }

  const runDecode = () => {
    const raw = decodeIn.value.trim()
    if (decodeObjectUrl) {
      URL.revokeObjectURL(decodeObjectUrl)
      decodeObjectUrl = null
    }
    if (!raw) {
      decodeOutput.innerHTML = `<div class="wt-empty">${escapeHtml(t('base64.emptyInput'))}</div>`
      return
    }
    try {
      const { base64, mime } = parseBase64Input(raw)
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      if (mime?.startsWith('image/')) {
        const blob = new Blob([bytes], { type: mime })
        const url = URL.createObjectURL(blob)
        decodeObjectUrl = url
        const ext = mime.split('/')[1] || 'bin'
        decodeOutput.innerHTML = `
          <div class="wt-base64-preview">
            <img src="${escapeAttr(url)}" alt="Decoded" loading="lazy" />
            <div class="wt-row wt-row--wrap">
              <a class="wt-button wt-button--ghost" href="${escapeAttr(url)}" download="decoded.${escapeAttr(ext)}">${escapeHtml(t('base64.download'))}</a>
            </div>
          </div>
        `
        return
      }
      if (mime?.startsWith('audio/')) {
        const blob = new Blob([bytes], { type: mime })
        const url = URL.createObjectURL(blob)
        decodeObjectUrl = url
        const ext = mime.split('/')[1] || 'bin'
        decodeOutput.innerHTML = `
          <div class="wt-base64-preview">
            <audio controls src="${escapeAttr(url)}"></audio>
            <div class="wt-row wt-row--wrap">
              <a class="wt-button wt-button--ghost" href="${escapeAttr(url)}" download="decoded.${escapeAttr(ext)}">${escapeHtml(t('base64.download'))}</a>
            </div>
          </div>
        `
        return
      }

      const text = base64ToText(base64)
      decodeOutput.innerHTML = `<pre class="wt-pre">${escapeHtml(text)}</pre><div class="wt-row wt-row--wrap"><button class="wt-button wt-button--ghost" type="button" id="wt-base64-copy-text">${escapeHtml(t('base64.copy'))}</button></div>`
      const copyTextBtn = decodeOutput.querySelector('#wt-base64-copy-text')
      copyTextBtn?.addEventListener('click', () => copyToClipboard(text))
    } catch {
      decodeOutput.innerHTML = `<div class="wt-empty">${escapeHtml(t('base64.decodeError'))}</div>`
    }
  }

  encodeTab?.addEventListener('click', () => {
    mode = 'encode'
    updateUI()
  })
  decodeTab?.addEventListener('click', () => {
    mode = 'decode'
    updateUI()
  })

  filezone.addEventListener('click', () => fileInput.click())
  filezone.addEventListener('dragover', (e) => {
    e.preventDefault()
    filezone.classList.add('is-dragover')
  })
  filezone.addEventListener('dragleave', () => filezone.classList.remove('is-dragover'))
  filezone.addEventListener('drop', (e) => {
    e.preventDefault()
    filezone.classList.remove('is-dragover')
    const file = e.dataTransfer?.files[0]
    if (file) {
      lastFile = file
      textIn.value = ''
      const name = escapeHtml(file.name)
      const size = (file.size / 1024).toFixed(1)
      filezone.querySelector('.wt-base64-filezone-text')!.innerHTML = `${name} (${size} KB)`
      runEncode()
    }
  })

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) {
      lastFile = file
      textIn.value = ''
      const name = escapeHtml(file.name)
      const size = (file.size / 1024).toFixed(1)
      filezone.querySelector('.wt-base64-filezone-text')!.innerHTML = `${name} (${size} KB)`
      runEncode()
    }
  })

  textIn.addEventListener('input', () => {
    if (textIn.value) {
      lastFile = null
      filezone.querySelector('.wt-base64-filezone-text')!.textContent = t('base64.dropFile')
      fileInput.value = ''
    }
    runEncode()
  })
  textIn.addEventListener('paste', () => setTimeout(runEncode, 0))
  dataUrlCheck.addEventListener('change', runEncode)

  copyBtn.addEventListener('click', () => copyToClipboard(output.value))
  decodeBtn.addEventListener('click', runDecode)
  decodeIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runDecode()
  })
}

function textToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    const bytes = new TextEncoder().encode(str)
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)))
    }
    return btoa(binary)
  }
}

function base64ToText(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)))
  } catch {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }
}

function parseBase64Input(raw: string): { base64: string; mime?: string } {
  const dataUrlMatch = raw.match(/^data:([^;]+);base64,(.+)$/s)
  if (dataUrlMatch) {
    return { base64: dataUrlMatch[2].replace(/\s/g, ''), mime: dataUrlMatch[1].trim() }
  }
  return { base64: raw.replace(/\s/g, '') }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttr(input: string): string {
  return input.replaceAll('"', '&quot;')
}
