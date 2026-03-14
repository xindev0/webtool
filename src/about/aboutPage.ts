import { t } from '../shared/i18n'
import { renderContentPage } from '../shared/contentPage'

export function renderAboutPage(container: HTMLElement) {
  renderContentPage(container, {
    title: t('about.title'),
    subtitle: t('about.subtitle'),
    sections: [
      {
        title: t('about.missionTitle'),
        paragraphs: [t('about.missionBody')],
      },
      {
        title: t('about.howTitle'),
        paragraphs: [t('about.howBody')],
      },
      {
        title: t('about.whyTitle'),
        paragraphs: [t('about.whyBody')],
      },
    ],
  })
}
