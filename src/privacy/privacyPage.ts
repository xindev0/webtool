import { t } from '../shared/i18n'

export function renderPrivacyPage(container: HTMLElement) {
  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('privacy.title'))}</h1>
    </section>

    <section class="wt-section">
      <div class="wt-card">
        <div class="wt-card__body">
          <p class="wt-card__desc">${escapeHtml(t('privacy.summary'))}</p>
          <p class="wt-card__desc">${escapeHtml(t('privacy.dataUsage'))}</p>
          <p class="wt-card__desc">${escapeHtml(t('privacy.thirdParty'))}</p>
          <p class="wt-card__desc">${escapeHtml(t('privacy.contact'))}</p>
        </div>
      </div>
    </section>
  `
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
