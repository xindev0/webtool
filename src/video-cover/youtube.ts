export type YouTubeVariant = 'maxresdefault' | 'sddefault' | 'hqdefault' | 'mqdefault' | 'default'

export function extractYouTubeId(input: string): string | null {
  if (!input) return null

  // Accept raw ID as a convenience (11 chars)
  const raw = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  let url: URL
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v')
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v

    const parts = url.pathname.split('/').filter(Boolean)
    const embedIdx = parts.indexOf('embed')
    if (embedIdx >= 0 && parts[embedIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIdx + 1])) {
      return parts[embedIdx + 1]
    }

    const shortsIdx = parts.indexOf('shorts')
    if (shortsIdx >= 0 && parts[shortsIdx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[shortsIdx + 1])) {
      return parts[shortsIdx + 1]
    }
  }

  return null
}

export function getYouTubeThumbnails(videoId: string, variants: YouTubeVariant[]) {
  const unique = Array.from(new Set(variants))
  return unique.map((variant) => ({
    variant,
    url: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${variant}.jpg`,
  }))
}

