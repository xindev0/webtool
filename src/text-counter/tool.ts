import { t } from '../shared/i18n'
import { escapeAttr, escapeHtml } from '../shared/utils'

export function renderTextCounterTool(container: HTMLElement) {
  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('textCounter.title'))}</h1>
      <p class="wt-muted">${escapeHtml(t('textCounter.desc'))}</p>
    </section>
    <section class="wt-section">
      <div class="wt-card">
        <div class="wt-card__body">
          <label class="wt-label" for="wt-text-counter-input">${escapeHtml(t('textCounter.input'))}</label>
          <textarea id="wt-text-counter-input" class="wt-textarea" rows="12" placeholder="${escapeAttr(t('textCounter.placeholder'))}"></textarea>
          <div class="wt-row wt-row--wrap wt-form__actions">
            <button class="wt-button wt-button--ghost" id="wt-text-counter-clear" type="button">${escapeHtml(t('textCounter.clear'))}</button>
          </div>
        </div>
      </div>
    </section>
    <section class="wt-section">
      <div class="wt-grid" id="wt-text-counter-stats" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));"></div>
    </section>
    <section class="wt-section wt-faq">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('common.faqTitle'))}</h2>
      </div>
      <div class="wt-faq__list">
        <details class="wt-faq__item">
          <summary class="wt-faq__question">${escapeHtml(t('textCounter.faq1Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('textCounter.faq1A'))}</p>
        </details>
        <details class="wt-faq__item">
          <summary class="wt-faq__question">${escapeHtml(t('textCounter.faq2Q'))}</summary>
          <p class="wt-faq__answer">${escapeHtml(t('textCounter.faq2A'))}</p>
        </details>
      </div>
    </section>
  `

  const input = container.querySelector<HTMLTextAreaElement>('#wt-text-counter-input')!
  const stats = container.querySelector<HTMLElement>('#wt-text-counter-stats')!

  const render = () => {
    const text = input.value
    const lines = text ? text.split(/\r?\n/) : []
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const paragraphs = text.trim() ? text.trim().split(/\r?\n/).filter((line) => line.trim()).length : 0
    const bytes = new TextEncoder().encode(text).length
    const readingMinutes = words / 250
    const speakingMinutes = words / 150

    const items = [
      { label: t('textCounter.characters'), value: String(chars) },
      { label: t('textCounter.charactersNoSpaces'), value: String(charsNoSpaces) },
      { label: t('textCounter.words'), value: String(words) },
      { label: t('textCounter.lines'), value: String(lines.length) },
      { label: t('textCounter.paragraphs'), value: String(paragraphs) },
      { label: t('textCounter.bytes'), value: String(bytes) },
      { label: t('textCounter.readingTime'), value: formatMinutes(readingMinutes) },
      { label: t('textCounter.speakingTime'), value: formatMinutes(speakingMinutes) },
    ]

    stats.innerHTML = items
      .map(
        (item) => `
          <div class="wt-card">
            <div class="wt-card__body">
              <h3 class="wt-card__title">${escapeHtml(item.label)}</h3>
              <p class="wt-card__desc">${escapeHtml(item.value)}</p>
            </div>
          </div>
        `,
      )
      .join('')
  }

  input.addEventListener('input', render)
  container.querySelector<HTMLButtonElement>('#wt-text-counter-clear')?.addEventListener('click', () => {
    input.value = ''
    render()
  })

  render()
}

function formatMinutes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 min'
  if (value < 1) return '< 1 min'
  return `${Math.ceil(value)} min`
}
