import '../style.css'
import { setLanguage, t, type Language } from '../shared/i18n'
import { renderLayout } from '../shared/layout'
import { registerPwa } from '../shared/pwa'
import { renderDisclaimerPage } from './disclaimerPage'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app container')

setLanguage()
registerPwa()
renderLayout(app, {
  activeNav: 'home',
  title: () => t('site.name'),
  pageTitle: () => t('title.disclaimer'),
  onLanguageChange: (next: Language) => {
    setLanguage(next)
    location.reload()
  },
  main: (mainEl) => renderDisclaimerPage(mainEl),
})
