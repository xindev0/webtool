import { t } from '../shared/i18n'
import { escapeAttr, escapeHtml } from '../shared/utils'

export function renderJsonFormatTool(container: HTMLElement) {
  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('jsonFormat.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('jsonFormat.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));">
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label" for="wt-json-input">${escapeHtml(t('jsonFormat.input'))}</label>
            <textarea id="wt-json-input" class="wt-textarea wt-textarea--mono" rows="14" placeholder="${escapeAttr(t('jsonFormat.placeholder'))}"></textarea>
            <div class="wt-row wt-row--wrap wt-form__actions">
              <button class="wt-button wt-button--primary" id="wt-json-format" type="button">${escapeHtml(t('jsonFormat.format'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-json-minify" type="button">${escapeHtml(t('jsonFormat.minify'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-json-validate" type="button">${escapeHtml(t('jsonFormat.validate'))}</button>
              <button class="wt-button wt-button--ghost" id="wt-json-clear" type="button">${escapeHtml(t('jsonFormat.clear'))}</button>
            </div>
            <p class="wt-help" id="wt-json-status">${escapeHtml(t('jsonFormat.idle'))}</p>
          </div>
        </div>
        <div class="wt-card">
          <div class="wt-card__body">
            <label class="wt-label" for="wt-json-output">${escapeHtml(t('jsonFormat.output'))}</label>
            <textarea id="wt-json-output" class="wt-textarea wt-textarea--mono" rows="14" readonly placeholder="${escapeAttr(t('jsonFormat.outputPlaceholder'))}"></textarea>
            <div class="wt-row wt-row--wrap wt-form__actions">
              <button class="wt-button wt-button--ghost" id="wt-json-copy" type="button">${escapeHtml(t('jsonFormat.copy'))}</button>
            </div>
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
          <summary class="wt-faq__question">${escapeHtml(t('jsonFormat.faq1Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('jsonFormat.faq1A'))}</p>
        </details>
        <details class="wt-faq__item">
          <summary class="wt-faq__question">${escapeHtml(t('jsonFormat.faq2Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('jsonFormat.faq2A'))}</p>
        </details>
      </div>
    </section>
  `

  const input = container.querySelector<HTMLTextAreaElement>('#wt-json-input')!
  const output = container.querySelector<HTMLTextAreaElement>('#wt-json-output')!
  const status = container.querySelector<HTMLElement>('#wt-json-status')!

  const updateStatus = (message: string, isError = false) => {
    status.textContent = message
    status.style.color = isError ? '#ef4444' : ''
  }

  const parseInput = (): unknown => JSON.parse(input.value)

  container.querySelector<HTMLButtonElement>('#wt-json-format')?.addEventListener('click', () => {
    try {
      output.value = JSON.stringify(parseInput(), null, 2)
      updateStatus(t('jsonFormat.valid'))
    } catch (error) {
      updateStatus(formatJsonError(error), true)
    }
  })

  container.querySelector<HTMLButtonElement>('#wt-json-minify')?.addEventListener('click', () => {
    try {
      output.value = JSON.stringify(parseInput())
      updateStatus(t('jsonFormat.valid'))
    } catch (error) {
      updateStatus(formatJsonError(error), true)
    }
  })

  container.querySelector<HTMLButtonElement>('#wt-json-validate')?.addEventListener('click', () => {
    try {
      parseInput()
      updateStatus(t('jsonFormat.valid'))
    } catch (error) {
      updateStatus(formatJsonError(error), true)
    }
  })

  container.querySelector<HTMLButtonElement>('#wt-json-clear')?.addEventListener('click', () => {
    input.value = ''
    output.value = ''
    updateStatus(t('jsonFormat.idle'))
  })

  container.querySelector<HTMLButtonElement>('#wt-json-copy')?.addEventListener('click', async () => {
    if (!output.value) return
    try {
      await navigator.clipboard.writeText(output.value)
      updateStatus(t('jsonFormat.copied'))
    } catch {
      updateStatus(t('jsonFormat.copyFailed'), true)
    }
  })
}

function formatJsonError(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid JSON'
}
