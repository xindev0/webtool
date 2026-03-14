import '../style.css'
import { setLanguage, t, type Language } from '../shared/i18n'
import { renderLayout } from '../shared/layout'
import { registerPwa } from '../shared/pwa'
import { renderChineseConvertTool } from './tool'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app container')

setLanguage()
registerPwa()
renderLayout(app, {
  activeNav: 'home',
  showBrand: true,
  title: () => t('site.name'),
  pageTitle: () => t('title.chineseConvert'),
  onLanguageChange: (next: Language) => {
    setLanguage(next)
    location.reload()
  },
  main: (mainEl) => renderChineseConvertTool(mainEl),
})
