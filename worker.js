// Cloudflare Worker: PPYH API CORS Proxy
// 部署到 Cloudflare Workers Dashboard 即可
// 部署后把 xxx.workers.dev 地址填入 index.html 的 PPYH_WORKER_URL

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-APP-ID',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // 仅接受 POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const upstream = 'https://www.ppyh.xyz/cbm-service/buyer/render/spu-detail'

  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'e76eb7565cc68344b2714b2fb7e759c8573326753c6367d4eb5c18fe72a18c62',
        'X-APP-ID': '1674015465824976901',
      },
      body: request.body,
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ code: '500', message: err.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}
