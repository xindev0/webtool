import { t } from '../shared/i18n'
import { renderContentPage } from '../shared/contentPage'

export function renderContactPage(container: HTMLElement) {
  renderContentPage(container, {
    title: t('contact.title'),
    subtitle: t('contact.subtitle'),
    sections: [
      {
        title: t('contact.generalTitle'),
        paragraphs: [t('contact.generalBody'), t('contact.email')],
      },
      {
        title: t('contact.feedbackTitle'),
        paragraphs: [t('contact.feedbackBody')],
      },
      {
        title: t('contact.responseTitle'),
        paragraphs: [t('contact.responseBody')],
      },
    ],
  })
}
