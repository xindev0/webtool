import { t } from '../shared/i18n'
import { withBase } from '../shared/paths'
import { escapeAttr, escapeHtml } from '../shared/utils'

type ToolCategory = 'all' | 'media' | 'developer' | 'text' | 'time' | 'random'

type ToolMeta = {
  id: string
  category: Exclude<ToolCategory, 'all'>
  nameKey: string
  descKey: string
  href: string
  tags: string[]
}

const tools: ToolMeta[] = [
  {
    id: 'video-cover',
    category: 'media',
    nameKey: 'tool.videoCover.name',
    descKey: 'tool.videoCover.desc',
    href: 'tools/video-cover/',
    tags: ['youtube', 'bilibili', 'tiktok', 'cover', 'thumbnail', 'image', 'video', 'download', '视频', '封面', '下载'],
  },
  {
    id: 'base64',
    category: 'developer',
    nameKey: 'tool.base64.name',
    descKey: 'tool.base64.desc',
    href: 'tools/base64/',
    tags: ['base64', 'encode', 'decode', 'image', 'audio', 'text', '编码', '解码', '文件'],
  },
  {
    id: 'password',
    category: 'random',
    nameKey: 'tool.password.name',
    descKey: 'tool.password.desc',
    href: 'tools/password/',
    tags: ['password', 'generator', 'random', 'secure', '密码', '生成', '随机', '安全'],
  },
  {
    id: 'qrcode',
    category: 'text',
    nameKey: 'tool.qrCode.name',
    descKey: 'tool.qrCode.desc',
    href: 'tools/qrcode/',
    tags: ['qr', 'qrcode', 'barcode', '二维码', '生成', '扫码', 'logo'],
  },
  {
    id: 'lrc',
    category: 'text',
    nameKey: 'tool.lrc.name',
    descKey: 'tool.lrc.desc',
    href: 'tools/lrc/',
    tags: ['lrc', 'srt', 'lyrics', 'subtitle', '歌词', '字幕', 'timestamp', 'convert', '转换'],
  },
  {
    id: 'clock',
    category: 'time',
    nameKey: 'tool.clock.name',
    descKey: 'tool.clock.desc',
    href: 'tools/clock/',
    tags: ['clock', 'time', 'timezone', 'countdown', 'world clock', 'clock server', '时钟', '时间', '倒计时', '时区'],
  },
  {
    id: 'chinese-convert',
    category: 'text',
    nameKey: 'tool.chineseConvert.name',
    descKey: 'tool.chineseConvert.desc',
    href: 'tools/chinese-convert/',
    tags: ['simplified', 'traditional', 'chinese', 'convert', '简体', '繁体', '转换'],
  },
  {
    id: 'coin',
    category: 'random',
    nameKey: 'tool.coin.name',
    descKey: 'tool.coin.desc',
    href: 'tools/coin/',
    tags: ['coin', 'flip', 'random', '硬币', '抛硬币'],
  },
  {
    id: 'rps',
    category: 'random',
    nameKey: 'tool.rps.name',
    descKey: 'tool.rps.desc',
    href: 'tools/rps/',
    tags: ['rock', 'paper', 'scissors', 'rps', '猜拳'],
  },
  {
    id: 'dice',
    category: 'random',
    nameKey: 'tool.dice.name',
    descKey: 'tool.dice.desc',
    href: 'tools/dice/',
    tags: ['dice', 'roller', 'random', '骰子', '掷色子'],
  },
  {
    id: 'text-counter',
    category: 'text',
    nameKey: 'tool.textCounter.name',
    descKey: 'tool.textCounter.desc',
    href: 'tools/text-counter/',
    tags: ['text', 'counter', 'word', 'character', 'count', '文本', '字数', '统计'],
  },
  {
    id: 'json-format',
    category: 'developer',
    nameKey: 'tool.jsonFormat.name',
    descKey: 'tool.jsonFormat.desc',
    href: 'tools/json-format/',
    tags: ['json', 'formatter', 'validator', 'minify', '格式化', '校验', '压缩'],
  },
  {
    id: 'url-codec',
    category: 'developer',
    nameKey: 'tool.urlCodec.name',
    descKey: 'tool.urlCodec.desc',
    href: 'tools/url-codec/',
    tags: ['url', 'encode', 'decode', 'codec', '链接', '编码', '解码'],
  },
]

const categories: Array<{ id: ToolCategory; nameKey: string; descKey: string }> = [
  { id: 'all', nameKey: 'home.categoryAll', descKey: 'home.categoryAllDesc' },
  { id: 'media', nameKey: 'home.categoryMedia', descKey: 'home.categoryMediaDesc' },
  { id: 'developer', nameKey: 'home.categoryDeveloper', descKey: 'home.categoryDeveloperDesc' },
  { id: 'text', nameKey: 'home.categoryText', descKey: 'home.categoryTextDesc' },
  { id: 'time', nameKey: 'home.categoryTime', descKey: 'home.categoryTimeDesc' },
  { id: 'random', nameKey: 'home.categoryRandom', descKey: 'home.categoryRandomDesc' },
]

const toolIcons: Record<string, string> = {
  'video-cover':
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
  base64:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  password:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  qrcode:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  lrc:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="13" y2="14"/></svg>',
  clock:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>',
  'chinese-convert':
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M6 15c2-6 4-9 6-10 2 2 4 6 6 10"/><path d="M8 12h8"/></svg>',
  coin:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="7" ry="9"/><path d="M9 9h6"/><path d="M9 15h6"/></svg>',
  rps:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V6a2 2 0 1 1 4 0v5"/><path d="M11 11V5a2 2 0 1 1 4 0v6"/><path d="M15 11V7a2 2 0 1 1 4 0v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2a2 2 0 1 1 4 0v1"/></svg>',
  dice:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="8.5" cy="15.5" r="1"/></svg>',
  'text-counter':
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M4 12h10"/><path d="M4 17h7"/><path d="M18 11v8"/><path d="M15 14h6"/></svg>',
  'json-format':
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4C6 4 5 5 5 7v2"/><path d="M16 4c2 0 3 1 3 3v2"/><path d="M8 20c-2 0-3-1-3-3v-2"/><path d="M16 20c2 0 3-1 3-3v-2"/><path d="M10 9l2 3-2 3"/><path d="M14 9l-2 3 2 3"/></svg>',
  'url-codec':
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11.3 4.6"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07l1.41-1.41"/></svg>',
}

export function renderPortalHome(container: HTMLElement) {
  let activeCategory: ToolCategory = 'all'

  container.innerHTML = `
    <section class="wt-hero">
      <div class="wt-hero__logo"></div>
      <p class="wt-eyebrow">Lightweight Tools</p>
      <h1 class="wt-hero__title">${escapeHtml(t('home.heroTitle'))}</h1>
      <p class="wt-hero__subtitle">${escapeHtml(t('home.heroSubtitle'))}</p>
      <div class="wt-hero__actions">
        <a class="wt-button wt-button--primary" href="#wt-tool-grid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          ${escapeHtml(t('home.primaryCta'))}
        </a>
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-section__header">
        <div>
          <h2 class="wt-section__title">${escapeHtml(t('home.categoriesTitle'))}</h2>
          <p class="wt-muted">${escapeHtml(t('home.categoriesSubtitle'))}</p>
        </div>
      </div>
      <div class="wt-grid wt-grid--categories" id="wt-category-grid"></div>
    </section>

    <section class="wt-section" id="wt-tool-grid">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('home.toolsTitle'))}</h2>
        <input class="wt-input" id="wt-tool-search" type="search" style="flex:unset;width:280px;min-width:unset" placeholder="${escapeHtml(
          t('home.searchPlaceholder'),
        )}" aria-label="${escapeHtml(t('home.searchPlaceholder'))}" />
      </div>
      <div class="wt-grid" id="wt-tool-grid-inner"></div>
    </section>
  `

  const categoryGrid = container.querySelector<HTMLDivElement>('#wt-category-grid')
  const grid = container.querySelector<HTMLDivElement>('#wt-tool-grid-inner')
  const search = container.querySelector<HTMLInputElement>('#wt-tool-search')
  const toolTitle = container.querySelector<HTMLElement>('#wt-tool-grid .wt-section__title')
  if (!categoryGrid || !grid || !search || !toolTitle) return

  const getFilteredTools = () => {
    const query = (search.value ?? '').trim().toLowerCase()
    return tools.filter((tool) => {
      if (activeCategory !== 'all' && tool.category !== activeCategory) return false
      if (!query) return true
      const name = t(tool.nameKey).toLowerCase()
      const desc = t(tool.descKey).toLowerCase()
      return name.includes(query) || desc.includes(query) || tool.tags.some((tag) => tag.includes(query))
    })
  }

  const renderCategories = () => {
    categoryGrid.innerHTML = categories
      .map((category) => {
        const count = category.id === 'all' ? tools.length : tools.filter((tool) => tool.category === category.id).length
        return `
          <button class="wt-category-card ${category.id === activeCategory ? 'is-active' : ''}" type="button" data-category="${escapeAttr(category.id)}">
            <span class="wt-category-card__count">${escapeHtml(t('home.categoryCount').replace('{count}', String(count)))}</span>
            <strong class="wt-category-card__title">${escapeHtml(t(category.nameKey))}</strong>
            <span class="wt-category-card__desc">${escapeHtml(t(category.descKey))}</span>
          </button>
        `
      })
      .join('')

    categoryGrid.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.category as ToolCategory
        render()
      })
    })
  }

  const render = () => {
    const filtered = getFilteredTools()
    renderCategories()

    const categoryNameKey = categories.find((item) => item.id === activeCategory)?.nameKey ?? 'home.categoryAll'
    toolTitle.textContent = activeCategory === 'all' ? t('home.toolsTitle') : `${t('home.toolsTitle')} - ${t(categoryNameKey)}`

    grid.innerHTML = filtered.length
      ? filtered.map(renderToolCard).join('')
      : `
        <article class="wt-card wt-card--static">
          <div class="wt-card__body">
            <h3 class="wt-card__title">${escapeHtml(t('home.noResultsTitle'))}</h3>
            <p class="wt-card__desc">${escapeHtml(t('home.noResultsDesc'))}</p>
          </div>
        </article>
      `
  }

  search.addEventListener('input', render)
  render()
}

function renderToolCard(tool: ToolMeta): string {
  const name = t(tool.nameKey)
  const desc = t(tool.descKey)
  const icon = toolIcons[tool.id] || ''
  return `
    <article class="wt-card">
      <div class="wt-card__body">
        <div class="wt-card__icon" style="margin-bottom:12px;color:var(--wt-primary);">${icon}</div>
        <h3 class="wt-card__title">${escapeHtml(name)}</h3>
        <p class="wt-card__desc">${escapeHtml(desc)}</p>
      </div>
      <div class="wt-card__footer">
        <a class="wt-button wt-button--ghost" href="${escapeAttr(withBase(tool.href))}">
          ${escapeHtml(t('tool.common.go'))}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </article>
  `
}
