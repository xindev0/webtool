import { t } from '../shared/i18n'

type Mode = 'toSrt' | 'toLrc' | 'toTxt'
type DetectedType = 'srt' | 'lrc' | 'text'

const MODES: Mode[] = ['toSrt', 'toLrc', 'toTxt']

function detectType(input: string): DetectedType {
  const s = input.trim()
  if (!s) return 'text'
  if (/\d{1,2}:\d{2}:\d{2}[,.]\d+\s*-->/.test(s)) return 'srt'
  if (/^\[\d{1,2}:\d{2}/.test(s)) return 'lrc'
  return 'text'
}

export function renderLrcTool(container: HTMLElement) {
  let mode: Mode = 'toSrt'

  const updateUI = () => {
    for (const m of MODES) {
      container.querySelector<HTMLElement>(`#wt-lrc-${m}`)!.hidden = mode !== m
      container.querySelector<HTMLElement>(`[data-mode="${m}"]`)!.classList.toggle('is-active', mode === m)
    }
  }

  // ── HTML builders ──────────────────────────────────────────────────────────

  const uploadSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`

  const mkSection = (id: string, pfx: string, defFn: string) => `
    <section class="wt-section" id="${id}" hidden>
      <div class="wt-form">
        <div class="wt-row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:6px;gap:6px;">
          <label class="wt-label" style="margin:0">${escapeHtml(t('lrc.input'))}</label>
          <div class="wt-row" style="gap:8px;align-items:center;">
            <span id="${pfx}-disp" class="wt-muted" style="font-size:0.82em;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>
            <label class="wt-button wt-button--ghost" style="font-size:0.82em;padding:4px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              ${uploadSvg}${escapeHtml(t('lrc.uploadFile'))}
              <input type="file" id="${pfx}-file" accept=".lrc,.srt,.txt" style="display:none"/>
            </label>
          </div>
        </div>
        <textarea class="wt-textarea wt-textarea--mono" id="${pfx}-in"
          placeholder="${escapeAttr(t('lrc.anyPlaceholder'))}" rows="8" spellcheck="false"></textarea>
        <span id="${pfx}-det" class="wt-muted" style="font-size:0.82em;margin-top:4px;display:block;min-height:1.2em;"></span>
      </div>
      <div class="wt-form" id="${pfx}-iv-row" hidden>
        <label class="wt-label">${escapeHtml(t('lrc.secondsPerLine'))}</label>
        <div class="wt-row" style="gap:8px;align-items:center;">
          <input class="wt-input" type="number" id="${pfx}-iv" value="5" min="0.5" max="600" step="0.5" style="width:100px;"/>
          <span class="wt-muted" style="font-size:0.85em;">${escapeHtml(t('lrc.secondsPerLineHint'))}</span>
        </div>
      </div>
      <div class="wt-form">
        <label class="wt-label" id="${pfx}-lbl">${escapeHtml(t('lrc.result'))}</label>
        <textarea class="wt-textarea wt-textarea--mono" id="${pfx}-out" readonly rows="8"
          placeholder="${escapeAttr(t('lrc.resultPlaceholder'))}"></textarea>
        <div class="wt-row wt-row--wrap wt-form__actions" style="align-items:center;">
          <input class="wt-input" type="text" id="${pfx}-fn" value="${escapeAttr(defFn)}"
            style="flex:1;min-width:140px;max-width:240px;" aria-label="${escapeAttr(t('lrc.filename'))}"/>
          <button class="wt-button wt-button--primary" type="button" id="${pfx}-copy">${escapeHtml(t('lrc.copy'))}</button>
          <button class="wt-button wt-button--ghost" type="button" id="${pfx}-dl">${escapeHtml(t('lrc.download'))}</button>
        </div>
      </div>
    </section>`

  // ── Render ─────────────────────────────────────────────────────────────────

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('lrc.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('lrc.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-tabs" role="tablist">
        <button class="wt-tab is-active" type="button" role="tab" data-mode="toSrt">${escapeHtml(t('lrc.tabToSrt'))}</button>
        <button class="wt-tab" type="button" role="tab" data-mode="toLrc">${escapeHtml(t('lrc.tabToLrc'))}</button>
        <button class="wt-tab" type="button" role="tab" data-mode="toTxt">${escapeHtml(t('lrc.tabToTxt'))}</button>
      </div>
    </section>
    ${mkSection('wt-lrc-toSrt', 'wt-s', 'output.srt').replace('hidden', '')}
    ${mkSection('wt-lrc-toLrc', 'wt-l', 'output.lrc')}
    ${mkSection('wt-lrc-toTxt', 'wt-t', 'output.txt')}
  `

  // ── Tabs ───────────────────────────────────────────────────────────────────

  for (const m of MODES) {
    container.querySelector(`[data-mode="${m}"]`)!.addEventListener('click', () => { mode = m; updateUI() })
  }

  // ── Query helpers ──────────────────────────────────────────────────────────

  const $ta  = (id: string) => container.querySelector<HTMLTextAreaElement>('#' + id)!
  const $in  = (id: string) => container.querySelector<HTMLInputElement>('#' + id)!
  const $btn = (id: string) => container.querySelector<HTMLButtonElement>('#' + id)!
  const $el  = (id: string) => container.querySelector<HTMLElement>('#' + id)!

  const detLabel = (type: DetectedType) =>
    type === 'srt' ? t('lrc.detectedSrt') : type === 'lrc' ? t('lrc.detectedLrc') : t('lrc.detectedText')

  // ── Generic section binder ─────────────────────────────────────────────────

  type ConvertFn = (raw: string, type: DetectedType, interval: number) => { text: string; count: number } | null

  function bindSection(pfx: string, ext: string, showInterval: (t: DetectedType) => boolean, convert: ConvertFn) {
    const taIn  = $ta(`${pfx}-in`)
    const taOut = $ta(`${pfx}-out`)
    const det   = $el(`${pfx}-det`)
    const ivRow = $el(`${pfx}-iv-row`)
    const ivIn  = $in(`${pfx}-iv`)
    const lbl   = $el(`${pfx}-lbl`)

    const run = () => {
      const raw  = taIn.value
      const type = detectType(raw)
      det.textContent = raw.trim() ? detLabel(type) : ''
      ivRow.hidden = !showInterval(type)

      if (!raw.trim()) { taOut.value = ''; lbl.textContent = t('lrc.result'); return }

      const r = convert(raw, type, parseFloat(ivIn.value) || 5)
      taOut.value = r?.text ?? ''
      lbl.textContent = r
        ? `${t('lrc.result')} (${r.count} ${t('lrc.lines')})`
        : t('lrc.result')
    }

    taIn.addEventListener('input', run)
    taIn.addEventListener('paste', () => setTimeout(run, 0))
    ivIn.addEventListener('input', run)

    // File upload + drag-drop
    const fileIn = $in(`${pfx}-file`)
    const disp   = $el(`${pfx}-disp`)
    const loadFile = (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        taIn.value = reader.result as string
        disp.textContent = file.name
        const base = file.name.replace(/\.[^.]+$/, '')
        $in(`${pfx}-fn`).dataset.base = base
        $in(`${pfx}-fn`).value = `${base}.${ext}`
        run()
      }
      reader.readAsText(file, 'utf-8')
    }
    fileIn.addEventListener('change', () => { if (fileIn.files?.[0]) loadFile(fileIn.files[0]) })
    taIn.addEventListener('dragover', (e) => { e.preventDefault(); taIn.style.outline = '2px dashed var(--wt-primary)' })
    taIn.addEventListener('dragleave', () => { taIn.style.outline = '' })
    taIn.addEventListener('drop', (e) => {
      e.preventDefault(); taIn.style.outline = ''
      if (e.dataTransfer?.files[0]) loadFile(e.dataTransfer.files[0])
    })

    // Copy / download
    $btn(`${pfx}-copy`).addEventListener('click', () => copyToClipboard(taOut.value, $btn(`${pfx}-copy`)))
    $btn(`${pfx}-dl`).addEventListener('click', () =>
      downloadFile(taOut.value, $in(`${pfx}-fn`).value || `output.${ext}`, 'text/plain'))
  }

  // ── → SRT ─────────────────────────────────────────────────────────────────

  bindSection('wt-s', 'srt', (type) => type === 'text', (raw, type, iv) => {
    if (type === 'lrc') {
      const lines = parseLrc(raw).filter(l => l.text)
      return lines.length ? { text: lrcToSrt(lines), count: lines.length } : null
    }
    if (type === 'srt') {
      const entries = parseSrt(raw)
      return entries.length ? { text: srtNormalize(entries), count: entries.length } : null
    }
    const lines = raw.split('\n').filter(l => l.trim())
    return lines.length ? { text: textToSrt(lines, iv), count: lines.length } : null
  })

  // ── → LRC ─────────────────────────────────────────────────────────────────

  bindSection('wt-l', 'lrc', (type) => type === 'text', (raw, type, iv) => {
    if (type === 'srt') {
      const entries = parseSrt(raw)
      return entries.length
        ? {
            text: lrcLinesToString(entries.flatMap((e) => splitCueText(e.text).map((text) => ({ time: e.start, text })))),
            count: entries.length,
          }
        : null
    }
    if (type === 'lrc') {
      const lines = parseLrc(raw).filter(l => l.text)
      return lines.length ? { text: lrcLinesToString(lines), count: lines.length } : null
    }
    const lines = raw.split('\n').filter(l => l.trim())
    return lines.length ? { text: textToLrc(lines, iv), count: lines.length } : null
  })

  // ── → TXT ─────────────────────────────────────────────────────────────────

  bindSection('wt-t', 'txt', () => false, (raw, type) => {
    if (type === 'srt') {
      const entries = parseSrt(raw)
      return entries.length ? { text: entries.flatMap((e) => splitCueText(e.text)).join('\n'), count: entries.length } : null
    }
    if (type === 'lrc') {
      const lines = parseLrc(raw).filter(l => l.text)
      return lines.length ? { text: lines.map(l => l.text).join('\n'), count: lines.length } : null
    }
    const lines = raw.split('\n').filter(l => l.trim())
    return lines.length ? { text: lines.join('\n'), count: lines.length } : null
  })
}

// ── Conversion logic ──────────────────────────────────────────────────────────

interface LrcLine  { time: number; text: string }
interface SrtEntry { start: number; end: number; text: string }

function parseLrc(lrc: string): LrcLine[] {
  const result: LrcLine[] = []
  const pat = /^\[(\d+):(\d+(?:[.:]\d+)?)\](.*)/
  for (const raw of lrc.split('\n')) {
    const m = raw.trim().match(pat)
    if (!m) continue
    result.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2].replace(':', '.')), text: m[3].trim() })
  }
  return result.sort((a, b) => a.time - b.time)
}

function lrcLinesToString(lines: LrcLine[]): string {
  return lines.map(l => {
    const min = Math.floor(l.time / 60)
    const sec = l.time % 60
    return `[${String(min).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}]${l.text}`
  }).join('\n')
}

function textToLrc(lines: string[], interval: number): string {
  return lines.map((line, i) => {
    const total = i * interval
    const min = Math.floor(total / 60)
    return `[${String(min).padStart(2, '0')}:${(total % 60).toFixed(2).padStart(5, '0')}]${line}`
  }).join('\n')
}

function lrcToSrt(lines: LrcLine[]): string {
  return lines.map((line, i) => {
    const end = i < lines.length - 1 ? lines[i + 1].time : line.time + 3
    return `${i + 1}\n${fmtSrtTime(line.time)} --> ${fmtSrtTime(end)}\n${line.text}`
  }).join('\n\n')
}

function parseSrt(srt: string): SrtEntry[] {
  const result: SrtEntry[] = []
  const timePat = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/
  for (const block of srt.trim().split(/\n\s*\n/)) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue
    const m = lines.find(l => timePat.test(l))?.match(timePat)
    if (!m) continue
    const ts = (h: string, mn: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(mn) * 60 + parseInt(s) + parseInt(ms) / 1000
    const text = lines.filter(l => !l.match(/^\d+$/) && !timePat.test(l)).map(l => l.trim()).filter(Boolean).join('\n')
    if (text) result.push({ start: ts(m[1], m[2], m[3], m[4]), end: ts(m[5], m[6], m[7], m[8]), text })
  }
  return result
}

function splitCueText(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

function srtNormalize(entries: SrtEntry[]): string {
  return entries.map((e, i) =>
    `${i + 1}\n${fmtSrtTime(e.start)} --> ${fmtSrtTime(e.end)}\n${e.text}`
  ).join('\n\n')
}

function textToSrt(lines: string[], interval: number): string {
  return lines.map((line, i) => {
    const start = i * interval
    return `${i + 1}\n${fmtSrtTime(start)} --> ${fmtSrtTime(start + interval)}\n${line}`
  }).join('\n\n')
}

function fmtSrtTime(seconds: number): string {
  const h  = Math.floor(seconds / 3600)
  const mn = Math.floor((seconds % 3600) / 60)
  const s  = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function copyToClipboard(text: string, btn: HTMLElement): Promise<void> {
  if (!text) return
  try { await navigator.clipboard.writeText(text) }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
  }
  const orig = btn.textContent
  btn.textContent = '✓'
  setTimeout(() => { btn.textContent = orig }, 1200)
}

function downloadFile(content: string, filename: string, mime: string): void {
  if (!content) return
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function escapeAttr(s: string): string { return s.replaceAll('"', '&quot;') }
