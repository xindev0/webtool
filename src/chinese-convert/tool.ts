import { t } from '../shared/i18n'
import { escapeAttr, escapeHtml } from '../shared/utils'

type ConverterFn = (input: string) => string

let converterPromise: Promise<{ s2t: ConverterFn; t2s: ConverterFn }> | null = null

export function renderChineseConvertTool(container: HTMLElement) {
  let mode: 's2t' | 't2s' = 's2t'

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('chineseConvert.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('chineseConvert.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-tabs">
        <button class="wt-tab is-active" data-mode="s2t" type="button">${escapeHtml(t('chineseConvert.s2t'))}</button>
        <button class="wt-tab" data-mode="t2s" type="button">${escapeHtml(t('chineseConvert.t2s'))}</button>
      </div>
    </section>
    <section class="wt-section">
      <div class="wt-card wt-card--static">
        <div class="wt-card__body">
          <p class="wt-help" style="margin-top:0;">${escapeHtml(t('chineseConvert.warning'))}</p>
        </div>
      </div>
    </section>
    <section class="wt-section">
      <div class="wt-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label">${escapeHtml(t('chineseConvert.input'))}</label>
            <textarea id="wt-cc-input" class="wt-textarea wt-textarea--mono" rows="12" placeholder="${escapeAttr(t('chineseConvert.placeholder'))}"></textarea>
          </div>
        </div>
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label">${escapeHtml(t('chineseConvert.output'))}</label>
            <textarea id="wt-cc-output" class="wt-textarea wt-textarea--mono" rows="12" readonly placeholder="${escapeAttr(t('chineseConvert.resultPlaceholder'))}"></textarea>
            <div class="wt-row wt-row--wrap wt-form__actions">
              <button class="wt-button wt-button--primary" id="wt-cc-copy" type="button">${escapeHtml(t('chineseConvert.copy'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-cc-swap" type="button">${escapeHtml(t('chineseConvert.swap'))}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `

  const input = container.querySelector<HTMLTextAreaElement>('#wt-cc-input')!
  const output = container.querySelector<HTMLTextAreaElement>('#wt-cc-output')!
  const copyBtn = container.querySelector<HTMLButtonElement>('#wt-cc-copy')!

  const update = async () => {
    const converters = await loadConverters()
    output.value = mode === 's2t' ? converters.s2t(input.value) : converters.t2s(input.value)
  }

  container.querySelectorAll<HTMLElement>('[data-mode]').forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode as 's2t' | 't2s'
      container.querySelectorAll<HTMLElement>('[data-mode]').forEach((node) => {
        node.classList.toggle('is-active', node === tab)
      })
      void update()
    })
  })

  input.addEventListener('input', () => {
    void update()
  })
  container.querySelector<HTMLButtonElement>('#wt-cc-swap')?.addEventListener('click', () => {
    const nextInput = output.value
    input.value = nextInput
    mode = mode === 's2t' ? 't2s' : 's2t'
    container.querySelectorAll<HTMLElement>('[data-mode]').forEach((node) => {
      node.classList.toggle('is-active', node.dataset.mode === mode)
    })
    void update()
  })
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value)
    } catch {
      const textarea = Object.assign(document.createElement('textarea'), { value: output.value })
      textarea.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    const original = copyBtn.textContent
    copyBtn.textContent = t('chineseConvert.copied')
    setTimeout(() => {
      copyBtn.textContent = original
    }, 1200)
  })

  void update()
}

async function loadConverters(): Promise<{ s2t: ConverterFn; t2s: ConverterFn }> {
  if (!converterPromise) {
    converterPromise = Promise.all([import('opencc-js/cn2t'), import('opencc-js/t2cn')]).then(([cn2t, t2cn]) => ({
      s2t: cn2t.Converter({ from: 'cn', to: 'tw' }),
      t2s: t2cn.Converter({ from: 'tw', to: 'cn' }),
    }))
  }
  return converterPromise
}
