import { t } from '../shared/i18n'
import { renderContentPage } from '../shared/contentPage'

export function renderDisclaimerPage(container: HTMLElement) {
  renderContentPage(container, {
    title: t('disclaimer.title'),
    sections: [
      {
        title: t('disclaimer.infoTitle'),
        paragraphs: [t('disclaimer.infoBody')],
      },
      {
        title: t('disclaimer.platformTitle'),
        paragraphs: [t('disclaimer.platformBody')],
      },
    ],
  })
}
