const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\13426\\Desktop\\白卡盒算价系统';
http.createServer((q, r) => {
  let f = q.url === '/' ? 'index.html' : q.url.slice(1);
  try {
    let c = fs.readFileSync(path.join(dir, f));
    let ext = path.extname(f);
    let mime = ext === '.html' ? 'text/html;charset=utf-8' : ext === '.js' ? 'application/javascript' : 'text/plain';
    r.writeHead(200, { 'Content-Type': mime });
    r.end(c);
  } catch (e) {
    r.writeHead(404);
    r.end('Not found');
  }
}).listen(8765, () => console.log('Server running at http://localhost:8765'));
