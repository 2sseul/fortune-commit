// 로컬 개발용 서버
// Vercel에 로그인하지 않아도 `npm run dev`로 위젯과 예시 갤러리를 브라우저에서 확인할 수 있게 해 준다.
// 실제 배포 때는 이 파일을 쓰지 않고, Vercel이 api/index.js와 public/ 폴더를 직접 사용한다.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from './api/index.js';

const PORT = Number(process.env.PORT) || 3000;
const GALLERY = new URL('./public/index.html', import.meta.url);

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  // /api 와 /api/ 는 위젯 함수로 보낸다.
  if (pathname === '/api' || pathname === '/api/') {
    handler(req, res);
    return;
  }

  // 첫 화면(/)은 예시 갤러리 페이지를 보여준다.
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(await readFile(GALLERY));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('갤러리는 /, 위젯 주소는 /api 입니다. 예: http://localhost:3000/api?user=octocat');
});

server.listen(PORT, () => {
  console.log(`예시 갤러리: http://localhost:${PORT}/`);
  console.log(`위젯: http://localhost:${PORT}/api?user=octocat`);
});
