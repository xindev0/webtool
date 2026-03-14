import { t } from '../shared/i18n'
import { renderContentPage } from '../shared/contentPage'

export function renderTermsPage(container: HTMLElement) {
  renderContentPage(container, {
    title: t('terms.title'),
    sections: [
      {
        title: t('terms.useTitle'),
        paragraphs: [t('terms.useBody')],
      },
      {
        title: t('terms.contentTitle'),
        paragraphs: [t('terms.contentBody')],
      },
      {
        title: t('terms.liabilityTitle'),
        paragraphs: [t('terms.liabilityBody')],
      },
    ],
  })
}
