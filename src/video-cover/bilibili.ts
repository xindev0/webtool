export type BilibiliVideoId =
  | { kind: 'bvid'; value: string; url: string }
  | { kind: 'aid'; value: string; url: string }
  | { kind: 'shorturl'; value: string; url: string }

export function parseBilibiliVideoId(input: string): BilibiliVideoId | null {
  if (!input) return null
  const raw = input.trim()

  // Accept raw BV id
  const bvMatch = raw.match(/\b(BV[0-9A-Za-z]{10})\b/)
  if (bvMatch) {
    const bvid = bvMatch[1]
    return { kind: 'bvid', value: bvid, url: `https://www.bilibili.com/video/${bvid}` }
  }

  // Accept raw av12345 / AV12345
  const avMatch = raw.match(/\b[aA][vV](\d+)\b/)
  if (avMatch) {
    const aid = avMatch[1]
    return { kind: 'aid', value: aid, url: `https://www.bilibili.com/video/av${aid}` }
  }

  let url: URL
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'b23.tv') {
    const fullUrl = url.href
    return { kind: 'shorturl', value: fullUrl, url: fullUrl }
  }
  if (host !== 'bilibili.com' && host !== 'm.bilibili.com') return null

  const path = url.pathname
  const pathBv = path.match(/\/video\/(BV[0-9A-Za-z]{10})/i)
  if (pathBv) {
    const bvid = `BV${pathBv[1].slice(2)}`
    return { kind: 'bvid', value: bvid, url: `https://www.bilibili.com/video/${bvid}` }
  }

  const pathAv = path.match(/\/video\/av(\d+)/i)
  if (pathAv) {
    const aid = pathAv[1]
    return { kind: 'aid', value: aid, url: `https://www.bilibili.com/video/av${aid}` }
  }

  return null
}

