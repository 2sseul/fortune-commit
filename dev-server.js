// 로컬 개발용 서버
// Vercel에 로그인하지 않아도 `npm run dev`로 위젯과 예시 갤러리를 브라우저에서 확인할 수 있게 해 준다.
// 실제 배포 때는 이 파일을 쓰지 않고, Vercel이 api/index.js와 public/ 폴더를 직접 사용한다.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from './api/index.js';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = new URL('./public/', import.meta.url);

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  // /api 와 /api/ 는 위젯 함수로, /api/me, /api/auth/login 같은 주소는 api/ 폴더의 같은 이름 파일로 보낸다.
  if (pathname === '/api' || pathname === '/api/') {
    handler(req, res);
    return;
  }
  if (/^\/api(\/[a-z]+)+$/.test(pathname)) {
    try {
      const module = await import(new URL(`.${pathname}.js`, import.meta.url));
      await module.default(req, res);
    } catch {
      res.statusCode = 404;
      res.end('없는 주소예요.');
    }
    return;
  }

  // 첫 화면(/)은 예시 갤러리, /skins.html 처럼 public/ 안의 html 페이지도 보여준다.
  const page = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (/^[a-z0-9-]+\.html$/.test(page)) {
    try {
      const html = await readFile(new URL(page, PUBLIC));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
      return;
    } catch {
      // 없는 페이지면 아래의 404로 넘어간다.
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('갤러리는 /, 위젯 주소는 /api 입니다. 예: http://localhost:3000/api?user=octocat');
});

server.listen(PORT, () => {
  console.log(`예시 갤러리: http://localhost:${PORT}/`);
  console.log(`스킨 미리보기: http://localhost:${PORT}/skins.html`);
  console.log(`위젯: http://localhost:${PORT}/api?user=octocat`);
});
