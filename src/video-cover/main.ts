import '../style.css'
import { setLanguage, t, type Language } from '../shared/i18n'
import { renderLayout } from '../shared/layout'
import { registerPwa } from '../shared/pwa'
import { renderVideoCoverTool, type VideoCoverPlatform } from './videoCoverTool'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app container')

const platform = (document.body?.dataset?.platform as VideoCoverPlatform | undefined) ?? 'all'

const PLATFORM_TITLE_KEY: Record<VideoCoverPlatform, string> = {
  all: 'title.videoCover',
  youtube: 'title.videoCoverYouTube',
  bilibili: 'title.videoCoverBilibili',
  tiktok: 'title.videoCoverTikTok',
}

setLanguage()
registerPwa()
renderLayout(app, {
  activeNav: 'videoCover',
  title: () => t('site.name'),
  pageTitle: () => t(PLATFORM_TITLE_KEY[platform] ?? 'title.videoCover'),
  onLanguageChange: (next: Language) => {
    setLanguage(next)
    location.reload()
  },
  main: (mainEl) => renderVideoCoverTool(mainEl, { platform }),
})
