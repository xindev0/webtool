export async function onRequest({ request }) {
  const url = new URL(request.url)
  const rawUrl = url.searchParams.get('url')
  if (!rawUrl) return json({ error: 'Missing url.' }, 400)

  let videoUrl = normalizeUrl(rawUrl)
  if (!videoUrl || !isAllowedTikTokUrl(videoUrl)) {
    return json({ error: 'Only TikTok URLs are allowed.' }, 400)
  }

  // Resolve short links (vm.tiktok.com, vt.tiktok.com) without allowing arbitrary redirects.
  try {
    const redirectResp = await fetch(videoUrl, { redirect: 'follow', headers: baseHeaders() })
    if (redirectResp.ok) videoUrl = redirectResp.url || videoUrl
  } catch {
    // keep best-effort URL
  }

  if (!isAllowedTikTokUrl(videoUrl)) {
    return json({ error: 'Only TikTok URLs are allowed.' }, 400)
  }

  const id = extractTikTokId(videoUrl)

  const oembed = await fetchTikTokOembed(videoUrl)
  if (oembed) {
    return json(
      {
        url: oembed.url,
        title: oembed.title ?? '',
        videoUrl,
        id,
        width: oembed.width ?? null,
        height: oembed.height ?? null,
      },
      200,
    )
  }

  const htmlCover = await fetchTikTokHtmlCover(videoUrl, id)
  if (htmlCover) {
    return json(
      {
        url: htmlCover.url,
        title: htmlCover.title ?? '',
        videoUrl,
        id,
      },
      200,
    )
  }

  return json({ error: 'Cover not found.' }, 502)
}

function baseHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
    Accept: 'text/html,application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  }
}

function normalizeUrl(rawUrl) {
  try {
    return new URL(rawUrl).toString()
  } catch {
    try {
      return new URL(`https://${rawUrl}`).toString()
    } catch {
      return ''
    }
  }
}

function isAllowedTikTokUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    return isAllowedTikTokHost(url.hostname)
  } catch {
    return false
  }
}

function isAllowedTikTokHost(hostname) {
  const host = hostname.toLowerCase()
  return host === 'tiktok.com' || host.endsWith('.tiktok.com')
}

async function fetchTikTokOembed(videoUrl) {
  const endpoints = [
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}&lang=en`,
  ]

  for (const endpoint of endpoints) {
    try {
      const resp = await fetch(endpoint, { headers: baseHeaders() })
      if (!resp.ok) continue
      const data = await resp.json()
      const cover = data?.thumbnail_url || data?.thumbnail_url_list?.[0]
      if (!cover) continue
      return {
        url: cover,
        title: data?.title || '',
        width: data?.thumbnail_width ?? null,
        height: data?.thumbnail_height ?? null,
      }
    } catch {
      // try next
    }
  }
  return null
}

async function fetchTikTokHtmlCover(videoUrl, id) {
  const htmlUrl = id ? `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}` : videoUrl
  try {
    const resp = await fetch(htmlUrl, { headers: baseHeaders() })
    if (!resp.ok) return null
    const html = await resp.text()
    const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || ''
    const image =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractFromHtml(html, /"cover"\s*:\s*"([^"]+)"/) ||
      extractFromHtml(html, /"dynamicCover"\s*:\s*"([^"]+)"/) ||
      extractFromHtml(html, /"originCover"\s*:\s*"([^"]+)"/) ||
      ''
    if (!image) return null
    return { url: image, title }
  } catch {
    return null
  }
}

function extractMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')
  const match = html.match(re)
  return match ? match[1] : ''
}

function extractFromHtml(html, regex) {
  const match = html.match(regex)
  if (!match) return ''
  return match[1]
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003D/g, '=')
}

function extractTikTokId(videoUrl) {
  try {
    const url = new URL(videoUrl)
    const match = url.pathname.match(/\/video\/(\d+)/)
    return match ? match[1] : ''
  } catch {
    return ''
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
