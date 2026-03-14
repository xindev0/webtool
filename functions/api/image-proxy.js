export async function onRequest({ request }) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get('url')
  if (!rawUrl) return new Response('Missing url', { status: 400 })

  let target
  try {
    target = new URL(rawUrl)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'https:') return new Response('Invalid protocol', { status: 400 })

  const host = target.hostname.toLowerCase()
  // Allowlist image hosts to prevent open proxy abuse.
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
  const allowed = allow.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))
  if (!allowed) return new Response('Host not allowed', { status: 403 })

  const upstream = await fetch(target.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!upstream.ok) {
    return new Response('Upstream error', { status: upstream.status })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Origin': '*',
  })

  return new Response(upstream.body, { status: 200, headers })
}


