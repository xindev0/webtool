import { t } from '../shared/i18n'
import { escapeAttr, escapeHtml } from '../shared/utils'

type Mode = 'encode' | 'decode'

export function renderUrlCodecTool(container: HTMLElement) {
  let mode: Mode = 'encode'

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('urlCodec.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('urlCodec.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-tabs" role="tablist">
        <button class="wt-tab is-active" data-mode="encode" type="button">${escapeHtml(t('urlCodec.encode'))}</button>
        <button class="wt-tab" data-mode="decode" type="button">${escapeHtml(t('urlCodec.decode'))}</button>
      </div>
    </section>
    <section class="wt-section">
      <div class="wt-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label" for="wt-url-codec-input">${escapeHtml(t('urlCodec.input'))}</label>
            <textarea id="wt-url-codec-input" class="wt-textarea wt-textarea--mono" rows="12" placeholder="${escapeAttr(t('urlCodec.placeholder'))}"></textarea>
          </div>
        </div>
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label" for="wt-url-codec-output">${escapeHtml(t('urlCodec.output'))}</label>
            <textarea id="wt-url-codec-output" class="wt-textarea wt-textarea--mono" rows="12" readonly placeholder="${escapeAttr(t('urlCodec.outputPlaceholder'))}"></textarea>
            <div class="wt-row wt-row--wrap wt-form__actions">
              <button class="wt-button wt-button--primary" id="wt-url-codec-run" type="button">${escapeHtml(t('urlCodec.run'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-url-codec-copy" type="button">${escapeHtml(t('urlCodec.copy'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-url-codec-swap" type="button">${escapeHtml(t('urlCodec.swap'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-url-codec-clear" type="button">${escapeHtml(t('urlCodec.clear'))}</button>
            </div>
            <p class="wt-help" id="wt-url-codec-status">${escapeHtml(t('urlCodec.idle'))}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="wt-section wt-faq">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('common.faqTitle'))}</h2>
      </div>
      <div class="wt-faq__list">
        <details class="wt-faq__item">
          <summary class="wt-faq__question">${escapeHtml(t('urlCodec.faq1Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('urlCodec.faq1A'))}</p>
        </details>
        <details class="wt-faq__item">
          <summary class="wt-faq__question">${escapeHtml(t('urlCodec.faq2Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('urlCodec.faq2A'))}</p>
        </details>
      </div>
    </section>
  `

  const input = container.querySelector<HTMLTextAreaElement>('#wt-url-codec-input')!
  const output = container.querySelector<HTMLTextAreaElement>('#wt-url-codec-output')!
  const status = container.querySelector<HTMLElement>('#wt-url-codec-status')!

  const setStatus = (message: string, isError = false) => {
    status.textContent = message
    status.style.color = isError ? '#ef4444' : ''
  }

  const run = () => {
    try {
      output.value = mode === 'encode' ? encodeURIComponent(input.value) : decodeURIComponent(input.value)
      setStatus(t('urlCodec.success'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t('urlCodec.failed'), true)
    }
  }

  container.querySelectorAll<HTMLElement>('[data-mode]').forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode as Mode
      container.querySelectorAll<HTMLElement>('[data-mode]').forEach((node) => {
        node.classList.toggle('is-active', node === tab)
      })
      setStatus(t('urlCodec.idle'))
    })
  })

  container.querySelector<HTMLButtonElement>('#wt-url-codec-run')?.addEventListener('click', run)
  container.querySelector<HTMLButtonElement>('#wt-url-codec-copy')?.addEventListener('click', async () => {
    if (!output.value) return
    try {
      await navigator.clipboard.writeText(output.value)
      setStatus(t('urlCodec.copied'))
    } catch {
      setStatus(t('urlCodec.copyFailed'), true)
    }
  })
  container.querySelector<HTMLButtonElement>('#wt-url-codec-swap')?.addEventListener('click', () => {
    input.value = output.value
    output.value = ''
    mode = mode === 'encode' ? 'decode' : 'encode'
    container.querySelectorAll<HTMLElement>('[data-mode]').forEach((node) => {
      node.classList.toggle('is-active', node.dataset.mode === mode)
    })
    setStatus(t('urlCodec.idle'))
  })
  container.querySelector<HTMLButtonElement>('#wt-url-codec-clear')?.addEventListener('click', () => {
    input.value = ''
    output.value = ''
    setStatus(t('urlCodec.idle'))
  })
}
