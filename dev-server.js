// 로컬 개발용 서버
// Vercel에 로그인하지 않아도 `npm run dev`로 위젯과 예시 갤러리를 브라우저에서 확인할 수 있게 해 준다.
// 실제 배포 때는 이 파일을 쓰지 않고, Vercel이 api/index.js와 public/ 폴더를 직접 사용한다.

import http from 'node:http';

// 개발 모드: Redis·GitHub 토큰·로그인 비밀값이 없어도 화면을 확인할 수 있게 한다. (v3)
//   Redis 대신 메모리 DB, GitHub 대신 가짜 활동(src/dev-fixtures.js), /api/auth/login은 DEV_LOGIN으로 바로 로그인
process.env.FC_DEV = '1';
process.env.SESSION_SECRET ||= 'dev-only-secret';
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
  // 개발 모드 로그인: GitHub 앱 설정이 없으면 DEV_LOGIN(기본 dev-cookie)으로 바로 로그인한다.
  if (pathname === '/api/auth/login' && !process.env.GITHUB_CLIENT_ID) {
    const { createSession, SESSION_COOKIE } = await import('./src/session.js');
    const next = new URL(req.url, 'http://localhost').searchParams.get('next') || '/';
    res.statusCode = 302;
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${createSession(process.env.DEV_LOGIN || 'dev-cookie')}; Path=/; HttpOnly; SameSite=Lax`);
    res.setHeader('Location', next.startsWith('/') ? next : '/');
    res.end();
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
  // img/ 안의 그림(png, webp)도 보여준다.
  const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', json: 'application/json; charset=utf-8' };
  const ext = page.split('.').pop();
  if (/^((img|cookies|img\/illust|img\/icons)\/)?[a-z0-9-]+\.(html|css|js|png|webp|svg|json)$/.test(page)) {
    try {
      const file = await readFile(new URL(page, PUBLIC));
      res.setHeader('Content-Type', types[ext]);
      res.end(file);
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
