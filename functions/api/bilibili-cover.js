export async function onRequest(context) {
  const url = new URL(context.request.url)
  let bvid = url.searchParams.get('bvid')
  let aid = url.searchParams.get('aid')
  const shortUrl = url.searchParams.get('url')

  if (!bvid && !aid && !shortUrl) {
    return json({ error: 'Missing bvid, aid, or url.' }, 400)
  }

  // Resolve b23.tv short links by following the redirect.
  if (shortUrl && !bvid && !aid) {
    try {
      const resolved = await fetch(shortUrl, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (WebTool Proxy)' },
      })
      const finalUrl = resolved.url
      const bvMatch = finalUrl.match(/\/video\/(BV[0-9A-Za-z]{10})/i)
      if (bvMatch) {
        bvid = `BV${bvMatch[1].slice(2)}`
      } else {
        const avMatch = finalUrl.match(/\/video\/av(\d+)/i)
        if (avMatch) aid = avMatch[1]
      }
    } catch {
      return json({ error: 'Failed to resolve short URL.' }, 502)
    }
    if (!bvid && !aid) {
      return json({ error: 'Could not extract video ID from short URL.' }, 400)
    }
  }

  const upstream = new URL('https://api.bilibili.com/x/web-interface/view')
  if (bvid) upstream.searchParams.set('bvid', bvid)
  if (aid) upstream.searchParams.set('aid', aid)

  const resp = await fetch(upstream.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (WebTool Proxy)',
      Referer: 'https://www.bilibili.com/',
      Accept: 'application/json',
    },
  })

  if (!resp.ok) {
    return json({ error: `Upstream error: ${resp.status}` }, 502)
  }

  const data = await resp.json()
  if (!data || data.code !== 0 || !data.data || !data.data.pic) {
    return json({ error: 'Invalid upstream response.' }, 502)
  }

  return json(
    {
      coverUrl: data.data.pic,
      title: data.data.title ?? '',
      bvid: data.data.bvid ?? bvid ?? '',
      aid: data.data.aid ?? aid ?? '',
    },
    200,
  )
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