import { t } from '../shared/i18n'
import { withBase } from '../shared/paths'
import { extractYouTubeId, getYouTubeThumbnails, type YouTubeVariant } from './youtube'
import { parseBilibiliVideoId, type BilibiliVideoId } from './bilibili'

export type VideoCoverPlatform = 'all' | 'youtube' | 'bilibili' | 'tiktok'

const YT_DEFAULT_VARIANTS: YouTubeVariant[] = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default']

const YT_RESOLUTION_MAP: Record<YouTubeVariant, string> = {
  maxresdefault: '1280x720',
  sddefault: '640x480',
  hqdefault: '480x360',
  mqdefault: '320x180',
  default: '120x90',
}

const PLATFORM_TABS: Array<{ id: VideoCoverPlatform; labelKey: string; href: string }> = [
  { id: 'all', labelKey: 'videoCover.tabAll', href: withBase('tools/video-cover/') },
  { id: 'youtube', labelKey: 'videoCover.tabYouTube', href: withBase('tools/video-cover/youtube/') },
  { id: 'bilibili', labelKey: 'videoCover.tabBilibili', href: withBase('tools/video-cover/bilibili/') },
  { id: 'tiktok', labelKey: 'videoCover.tabTikTok', href: withBase('tools/video-cover/tiktok/') },
]

export function renderVideoCoverTool(container: HTMLElement, opts?: { platform?: VideoCoverPlatform }) {
  const activePlatform = opts?.platform ?? 'all'
  const tabsHtml = PLATFORM_TABS.map((tab) => {
    const isActive = tab.id === activePlatform
    return `
      <a class="wt-tab ${isActive ? 'is-active' : ''}" role="tab" aria-selected="${isActive}" href="${escapeAttr(
        tab.href,
      )}">${escapeHtml(t(tab.labelKey))}</a>
    `
  }).join('')

  container.innerHTML = `
    <section class="wt-section">
      <h1 class="wt-page-title">${escapeHtml(t('tool.videoCover.name'))}</h1>
      <p class="wt-muted">${escapeHtml(t('tool.videoCover.desc'))}</p>
    </section>

    <section class="wt-section">
      <div class="wt-tabs" role="tablist" aria-label="${escapeHtml(t('videoCover.tabLabel'))}">
        ${tabsHtml}
      </div>
    </section>

    <section class="wt-section">
      <div class="wt-form">
        <label class="wt-label" for="wt-url">${escapeHtml(t('videoCover.inputLabel'))}</label>
        <div class="wt-row">
          <input class="wt-input" id="wt-url" type="text" inputmode="url" placeholder="${escapeAttr(
            t('videoCover.inputPlaceholder'),
          )}" />
          <button class="wt-button wt-button--primary" id="wt-run" type="button">${escapeHtml(t('videoCover.generate'))}</button>
        </div>
        <div class="wt-help" id="wt-platform"></div>
      </div>
    </section>

    <section class="wt-section" id="wt-size-section">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('videoCover.sizesTitle'))}</h2>
      </div>
      <div class="wt-chips" id="wt-variants"></div>
      <p class="wt-help">${escapeHtml(t('videoCover.sizesHint'))}</p>
    </section>

    <section class="wt-section">
      <div class="wt-section__header">
        <h2 class="wt-section__title">${escapeHtml(t('videoCover.resultsTitle'))}</h2>
      </div>
      <div id="wt-results" class="wt-grid wt-grid--media"></div>
    </section>
  `

  const urlInput = container.querySelector<HTMLInputElement>('#wt-url')
  const runBtn = container.querySelector<HTMLButtonElement>('#wt-run')
  const platformEl = container.querySelector<HTMLDivElement>('#wt-platform')
  const variantsEl = container.querySelector<HTMLDivElement>('#wt-variants')
  const resultsEl = container.querySelector<HTMLDivElement>('#wt-results')
  const sizeSection = container.querySelector<HTMLElement>('#wt-size-section')
  if (!urlInput || !runBtn || !platformEl || !variantsEl || !resultsEl || !sizeSection) return

  const selected = new Set<YouTubeVariant>(YT_DEFAULT_VARIANTS)
  variantsEl.innerHTML = YT_DEFAULT_VARIANTS.map((v) => renderVariantChip(v, true)).join('')
  variantsEl.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (!target?.dataset?.variant) return
    const v = target.dataset.variant as YouTubeVariant
    if (target.checked) selected.add(v)
    else selected.delete(v)
  })

  let runId = 0
  const run = async () => {
    const currentRun = ++runId
    const input = (urlInput.value ?? '').trim()
    resultsEl.innerHTML = ''

    if (activePlatform === 'youtube' || activePlatform === 'all') {
      const ytId = extractYouTubeId(input)
      if (ytId) {
        platformEl.textContent = t('videoCover.platformYouTube')
        sizeSection.style.display = ''
        const variants = Array.from(selected)
        const thumbs = getYouTubeThumbnails(ytId, variants)
        const title = await fetchYouTubeTitle(ytId)
        if (currentRun !== runId) return
        const displayTitle = title || `YouTube ${ytId}`
        resultsEl.innerHTML = thumbs.map((thumb) => renderThumbCard(thumb, displayTitle, ytId)).join('')
        return
      }
    }

    if (activePlatform === 'bilibili' || activePlatform === 'all') {
      const bili = parseBilibiliVideoId(input)
      if (bili) {
        platformEl.textContent = t('videoCover.platformBilibili')
        sizeSection.style.display = 'none'
        resultsEl.innerHTML = renderBilibiliLoading()
        fetchBilibiliCover(bili)
          .then((cover) => {
            if (currentRun !== runId) return
            resultsEl.innerHTML = renderBilibiliCoverCard(cover)
            setupImageResolution(container)
          })
          .catch(() => {
            if (currentRun !== runId) return
            resultsEl.innerHTML = renderBilibiliError(bili.url)
          })
        return
      }
    }

    if (activePlatform === 'tiktok' || activePlatform === 'all') {
      const tiktok = parseTikTokUrl(input)
      if (tiktok) {
        platformEl.textContent = t('videoCover.platformTikTok')
        sizeSection.style.display = 'none'
        resultsEl.innerHTML = renderBilibiliLoading()
        fetchTikTokCover(tiktok.url)
          .then((cover) => {
            if (currentRun !== runId) return
            resultsEl.innerHTML = renderExternalCoverCard('tiktok', { ...cover, id: cover.id ?? tiktok.id })
            setupImageResolution(container)
          })
          .catch(() => {
            if (currentRun !== runId) return
            resultsEl.innerHTML = renderGenericError()
          })
        return
      }
    }

    platformEl.textContent = t('videoCover.platformUnknown')
    sizeSection.style.display = 'none'
    resultsEl.innerHTML = `<div class="wt-empty">${escapeHtml(t('videoCover.invalidUrl'))}</div>`
  }

  runBtn.addEventListener('click', () => void run())
  setupDownloadButtons(container)
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') void run()
  })
}

type BilibiliCover = {
  url: string
  title: string
  videoUrl: string
  bvid?: string
}

type ExternalCover = {
  url: string
  title: string
  videoUrl: string
  id?: string
  width?: number
  height?: number
}

const BILIBILI_PROXY_ENDPOINTS = ['/api/bilibili-cover']
const TIKTOK_PROXY_ENDPOINT = '/api/tiktok-cover'
const IMAGE_PROXY_ENDPOINT = '/api/image-proxy'

// Proxy for image hosts that block direct downloads due to CORS.
function shouldUseImageProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    // Share a single allowlist between download logic and the proxy.
    const allow = [
      'ytimg.com',
      'img.youtube.com',
      'hdslb.com',
      'bilibili.com',
      'byteimg.com',
      'snssdk.com',
      'tiktokcdn.com',
      'tiktokcdn-us.com',
      'ttwstatic.com',
    ]
    return allow.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
  } catch {
    return false
  }
}

function toProxyUrl(url: string): string {
  return `${IMAGE_PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`
}

async function fetchAsDownload(url: string, filename: string) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error('download failed')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  triggerDownload(objectUrl, filename || 'download')
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
}

async function fetchBilibiliCover(bili: BilibiliVideoId): Promise<BilibiliCover> {
  const query =
    bili.kind === 'bvid'
      ? `bvid=${encodeURIComponent(bili.value)}`
      : bili.kind === 'aid'
        ? `aid=${encodeURIComponent(bili.value)}`
        : `url=${encodeURIComponent(bili.value)}`
  const errors: string[] = []

  for (const endpoint of BILIBILI_PROXY_ENDPOINTS) {
    const url = `${endpoint}?${query}`
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) {
        errors.push(`${endpoint}: ${res.status}`)
        continue
      }
      const data = (await res.json()) as { coverUrl?: string; title?: string; bvid?: string }
      if (data && typeof data.coverUrl === 'string') {
        return {
          url: data.coverUrl,
          title: data.title ?? '',
          videoUrl: bili.url,
          bvid: data.bvid,
        }
      }
      errors.push(`${endpoint}: invalid payload`)
    } catch (error) {
      errors.push(`${endpoint}: ${String(error)}`)
    }
  }

  throw new Error(errors.join('; '))
}

async function fetchTikTokCover(videoUrl: string): Promise<ExternalCover> {
  const url = `${TIKTOK_PROXY_ENDPOINT}?url=${encodeURIComponent(videoUrl)}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error('tiktok fetch failed')
  const data = (await res.json()) as ExternalCover
  if (!data || !data.url) throw new Error('invalid tiktok response')
  return data
}

function renderVariantChip(variant: YouTubeVariant, checked: boolean): string {
  const id = `wt-var-${variant}`
  return `
    <label class="wt-chip" for="${escapeAttr(id)}">
      <input id="${escapeAttr(id)}" type="checkbox" data-variant="${escapeAttr(variant)}" ${checked ? 'checked' : ''} />
      <span>${escapeHtml(variant)}</span>
    </label>
  `
}

function renderThumbCard(thumb: { variant: string; url: string }, title: string, videoId: string): string {
  const resolution = YT_RESOLUTION_MAP[thumb.variant as YouTubeVariant] || ''
  // Show video title above size/variant to match Bilibili card layout.
  const variantText = resolution ? `${thumb.variant} - ${resolution}` : thumb.variant
  const filenameBase = buildFilenameBase(title, videoId)
  const sizeLabel = resolution || thumb.variant
  const filename = `${filenameBase}-${sizeLabel}.jpg`
  return `
    <article class="wt-media">
      <div class="wt-media__preview">
        <img src="${escapeAttr(thumb.url)}" alt="${escapeAttr(title)}" loading="lazy" />
      </div>
      <div class="wt-media__meta">
        <div class="wt-media__title">${escapeHtml(title)}</div>
        <div class="wt-url">${escapeHtml(thumb.url)}</div>
        <div class="wt-muted">${escapeHtml(variantText)}</div>
        <div class="wt-media__actions">
          <button class="wt-button wt-button--ghost" type="button" data-download-url="${escapeAttr(
            thumb.url,
          )}" data-download-name="${escapeAttr(filename)}">${escapeHtml(t('videoCover.download'))}</button>
          <a class="wt-button wt-button--ghost" href="${escapeAttr(thumb.url)}" target="_blank" rel="noreferrer">${escapeHtml(
            t('videoCover.openImage'),
          )}</a>
          <button class="wt-button wt-button--ghost" type="button" data-copy-url="${escapeAttr(thumb.url)}">${escapeHtml(
            t('videoCover.copyLink'),
          )}</button>
        </div>
      </div>
    </article>
  `
}

function renderBilibiliLoading(): string {
  return `<div class="wt-empty">${escapeHtml(t('videoCover.loading'))}</div>`
}

function renderBilibiliCoverCard(cover: BilibiliCover): string {
  const baseTitle = cover.title || t('videoCover.bilibiliCoverTitle')
  const bilibiliId = cover.bvid ?? extractBilibiliIdFromUrl(cover.videoUrl) ?? 'id'
  const filenameBase = buildFilenameBase(baseTitle, bilibiliId)
  const filename = `${filenameBase}.jpg`
  return `
    <article class="wt-media">
      <div class="wt-media__preview">
        <img src="${escapeAttr(cover.url)}" alt="${escapeAttr(
    baseTitle,
  )}" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" data-res-source="bilibili" />
      </div>
      <div class="wt-media__meta">
        <div class="wt-media__title">${escapeHtml(baseTitle)}</div>
        <div class="wt-url">${escapeHtml(cover.url)}</div>
        <div class="wt-muted" data-res-target>-</div>
        <div class="wt-media__actions">
          <button class="wt-button wt-button--ghost" type="button" data-download-url="${escapeAttr(
            cover.url,
          )}" data-download-base="${escapeAttr(filenameBase)}" data-download-name="${escapeAttr(
    filename,
  )}">${escapeHtml(t('videoCover.download'))}</button>
          <a class="wt-button wt-button--ghost" href="${escapeAttr(cover.url)}" target="_blank" rel="noreferrer">${escapeHtml(
            t('videoCover.openImage'),
          )}</a>
          <button class="wt-button wt-button--ghost" type="button" data-copy-url="${escapeAttr(cover.url)}">${escapeHtml(
            t('videoCover.copyLink'),
          )}</button>
          <a class="wt-button wt-button--ghost" href="${escapeAttr(
            cover.videoUrl,
          )}" target="_blank" rel="noreferrer">${escapeHtml(t('videoCover.openVideoPage'))}</a>
        </div>
      </div>
    </article>
  `
}

function renderExternalCoverCard(platform: 'tiktok', cover: ExternalCover): string {
  const baseTitle = cover.title || 'cover'
  const externalId = cover.id || 'id'
  const filenameBase = buildFilenameBase(baseTitle, externalId)
  const filename = `${filenameBase}.jpg`
  const resolution = cover.width && cover.height ? `${cover.width}x${cover.height}` : ''
  const displayRes = resolution || '-'
  return `
    <article class="wt-media">
      <div class="wt-media__preview">
        <img src="${escapeAttr(cover.url)}" alt="${escapeAttr(
    baseTitle,
  )}" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" data-res-source="${platform}" />
      </div>
      <div class="wt-media__meta">
        <div class="wt-media__title">${escapeHtml(baseTitle)}</div>
        <div class="wt-url">${escapeHtml(cover.url)}</div>
        <div class="wt-muted" data-res-target>${escapeHtml(displayRes)}</div>
        <div class="wt-media__actions">
          <button class="wt-button wt-button--ghost" type="button" data-download-url="${escapeAttr(
            cover.url,
          )}" data-download-base="${escapeAttr(filenameBase)}" data-download-name="${escapeAttr(
    resolution ? `${filenameBase}-${resolution}.jpg` : filename,
  )}">${escapeHtml(t('videoCover.download'))}</button>
          <a class="wt-button wt-button--ghost" href="${escapeAttr(cover.url)}" target="_blank" rel="noreferrer">${escapeHtml(
            t('videoCover.openImage'),
          )}</a>
          <button class="wt-button wt-button--ghost" type="button" data-copy-url="${escapeAttr(cover.url)}">${escapeHtml(
            t('videoCover.copyLink'),
          )}</button>
          <a class="wt-button wt-button--ghost" href="${escapeAttr(
            cover.videoUrl,
          )}" target="_blank" rel="noreferrer">${escapeHtml(t('videoCover.openVideoPage'))}</a>
        </div>
      </div>
    </article>
  `
}

function renderBilibiliError(videoUrl: string): string {
  return `
    <div class="wt-callout">
      <div class="wt-callout__title">${escapeHtml(t('videoCover.bilibiliFetchFailedTitle'))}</div>
      <div class="wt-callout__body">
        <p>${escapeHtml(t('videoCover.bilibiliFetchFailedBody'))}</p>
        <div class="wt-row wt-row--wrap">
          <a class="wt-button wt-button--primary" href="${escapeAttr(videoUrl)}" target="_blank" rel="noreferrer">${escapeHtml(
            t('videoCover.openVideoPage'),
          )}</a>
        </div>
      </div>
    </div>
  `
}

function renderGenericError(): string {
  return `<div class="wt-empty">${escapeHtml(t('videoCover.fetchFailed'))}</div>`
}

function setupDownloadButtons(container: HTMLElement) {
  container.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const copyBtn = target.closest('button[data-copy-url]') as HTMLButtonElement | null
    if (copyBtn) {
      const url = copyBtn.dataset.copyUrl
      if (url) void copyToClipboard(url)
      return
    }
    const button = target.closest('button[data-download-url]') as HTMLButtonElement | null
    if (!button) return
    const url = button.dataset.downloadUrl
    const filename = button.dataset.downloadName || ''
    if (!url) return

    downloadFile(url, filename || 'download')
  })
}

function setupImageResolution(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll<HTMLImageElement>('img[data-res-source]'))
  images.forEach((img) => {
    const update = () => {
      if (!img.naturalWidth || !img.naturalHeight) return
      const card = img.closest('.wt-media')
      const target = card?.querySelector<HTMLElement>('[data-res-target]')
      if (target) target.textContent = `${img.naturalWidth}x${img.naturalHeight}`
      const button = card?.querySelector<HTMLButtonElement>('button[data-download-base]')
      if (button) {
        const base = button.dataset.downloadBase || 'cover'
        button.dataset.downloadName = `${base}-${img.naturalWidth}x${img.naturalHeight}.jpg`
      }
    }
    if (img.complete) update()
    else img.addEventListener('load', update, { once: true })
  })
}

async function downloadFile(url: string, filename: string) {
  const useProxy = shouldUseImageProxy(url)
  try {
    if (useProxy) {
      await fetchAsDownload(toProxyUrl(url), filename)
    } else {
      await fetchAsDownload(url, filename)
    }
  } catch {
    if (!useProxy) {
      try {
        await fetchAsDownload(toProxyUrl(url), filename)
        return
      } catch {
        // fallthrough
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
  try {
    const res = await Promise.race([
      fetch(url, { mode: 'cors' }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ])
    if (!res || !('ok' in res) || !(res as Response).ok) return null
    const data = (await (res as Response).json()) as { title?: string }
    return data?.title ?? null
  } catch {
    return null
  }
}

function parseTikTokUrl(input: string): { url: string; id?: string } | null {
  if (!input) return null
  const raw = input.trim()
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (!host.endsWith('tiktok.com')) return null
  const match = url.pathname.match(/\/video\/(\d+)/)
  const id = match ? match[1] : undefined
  return { url: url.toString(), id }
}

function extractBilibiliIdFromUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl)
    const match = url.pathname.match(/\/(BV[0-9A-Za-z]+|av\d+)/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function buildFilenameBase(title: string, id: string): string {
  const safeTitle = sanitizeFilename(title)
  const safeId = sanitizeFilename(id)
  return `${safeTitle}-${safeId}`
}

function sanitizeFilename(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'file'
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttr(input: string): string {
  return input.replaceAll('"', '&quot;')
}
