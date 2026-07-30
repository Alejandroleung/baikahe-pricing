const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const PPYH_API_HOST = 'api-client.qchezuo.cn';
const PPYH_API_PATH = '/cbm-service/buyer/render/spu-detail';
http.createServer((q, r) => {
  // CORS headers for all responses
  r.setHeader('Access-Control-Allow-Origin', '*');
  r.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-APP-ID');

  if (q.method === 'OPTIONS') {
    r.writeHead(204);
    r.end();
    return;
  }

  // ── 拼一拼盒 API 代理 ──
  if (q.method === 'POST' && q.url === '/api/ppyh/quote') {
    let body = '';
    q.on('data', chunk => body += chunk);
    q.on('end', () => {
      const options = {
        hostname: PPYH_API_HOST,
        path: PPYH_API_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Authorization': q.headers['authorization'] || '',
          'X-APP-ID': q.headers['x-app-id'] || '',
          'Content-Length': Buffer.byteLength(body)
        }
      };
      const proxyReq = https.request(options, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          r.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          r.end(data);
        });
      });
      proxyReq.on('error', () => {
        r.writeHead(502);
        r.end(JSON.stringify({ error: 'proxy failed' }));
      });
      proxyReq.write(body);
      proxyReq.end();
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
