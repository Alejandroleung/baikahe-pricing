const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;

http.createServer((q, r) => {
  r.setHeader('Access-Control-Allow-Origin', '*');
  if (q.method === 'OPTIONS') { r.writeHead(204); r.end(); return; }

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
