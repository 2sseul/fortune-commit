// 로컬 개발용 서버
// Vercel에 로그인하지 않아도 `npm run dev`로 위젯을 브라우저에서 확인할 수 있게 해 준다.
// 실제 배포 때는 이 파일을 쓰지 않고, Vercel이 api/index.js를 직접 실행한다.

import http from 'node:http';
import handler from './api/index.js';

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  // /api 와 /api/ 는 위젯 함수로 보낸다.
  if (pathname === '/api' || pathname === '/api/') {
    handler(req, res);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('위젯 주소는 /api 입니다. 예: http://localhost:3000/api?theme=light');
});

server.listen(PORT, () => {
  console.log(`포춘쿠키 위젯 개발 서버: http://localhost:${PORT}/api`);
});
