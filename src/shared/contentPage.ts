import { escapeHtml } from './utils'

type Section = {
  title: string
  paragraphs: string[]
}

export function renderContentPage(
  container: HTMLElement,
  options: {
    title: string
    subtitle?: string
    sections: Section[]
  },
) {
  const subtitle = options.subtitle ? `<p class="wt-muted">${escapeHtml(options.subtitle)}</p>` : ''
  const sections = options.sections
    .map(
      (section) => `
        <section class="wt-section">
          <div class="wt-card">
            <div class="wt-card__body">
              <h2 class="wt-section__title">${escapeHtml(section.title)}</h2>
              ${section.paragraphs.map((paragraph) => `<p class="wt-card__desc">${escapeHtml(paragraph)}</p>`).join('')}
            </div>
          </div>
        </section>
      `,
    )
    .join('')

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(options.title)}</h1>
      ${subtitle}
    </section>
    ${sections}
  `
}
