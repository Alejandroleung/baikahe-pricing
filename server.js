const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;

// 拼一拼盒 API 代理配置
const PPYH_UPSTREAM = 'https://www.ppyh.xyz/cbm-service/buyer/render/spu-detail';
const PPYH_AUTH = 'e76eb7565cc68344b2714b2fb7e759c8573326753c6367d4eb5c18fe72a18c62';
const PPYH_APP_ID = '1674015465824976901';

http.createServer((q, r) => {
  r.setHeader('Access-Control-Allow-Origin', '*');
  if (q.method === 'OPTIONS') { r.writeHead(204); r.end(); return; }

  // ── 拼一拼盒 API 代理 ──
  if (q.url === '/api/ppyh/quote' && q.method === 'POST') {
    let body = '';
    q.on('data', c => body += c);
    q.on('end', () => {
      fetch(PPYH_UPSTREAM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': PPYH_AUTH,
          'X-APP-ID': PPYH_APP_ID,
        },
        body: body,
      })
      .then(res => res.json())
      .then(data => {
        r.writeHead(200, { 'Content-Type': 'application/json' });
        r.end(JSON.stringify(data));
      })
      .catch(err => {
        r.writeHead(502);
        r.end(JSON.stringify({ code: '500', message: err.message }));
      });
    });
    return;
  }

  // ── 静态文件服务 ──
  let f = q.url === '/' ? 'index.html' : q.url.slice(1);
  try {
    let c = fs.readFileSync(path.join(dir, f));
    let ext = path.extname(f);
    let mime = ext === '.html' ? 'text/html;charset=utf-8'
      : ext === '.js' ? 'application/javascript'
      : ext === '.css' ? 'text/css'
      : ext === '.png' ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.svg' ? 'image/svg+xml'
      : 'text/plain';
    r.writeHead(200, { 'Content-Type': mime });
    r.end(c);
  } catch (e) {
    r.writeHead(404);
    r.end('Not found');
  }
}).listen(8765, () => console.log('Server running at http://localhost:8765'));
