// README용 화면 캡처 (선명한 2배 PNG, 커서 없이, 요소 단위로 자르기)
//   1) 개발 서버를 켠다:  DEV_LOGIN=2sseul FC_DEV_TODAY=2 PORT=3999 npm run dev
//   2) 이 스크립트:      node scripts/readme-shots.mjs [http://localhost:3999]
//   → img/v3/*.png
//
// Chrome을 원격 디버깅 모드로 띄우고(DevTools 프로토콜), 페이지를 열어 요소 위치만큼 잘라 찍는다.
// 개발 서버는 메모리 DB·가짜 GitHub 활동을 쓰므로 숫자(포인트, 연속 기록)는 예시 값이다.

import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3999';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../img/v3/', import.meta.url);
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = join(tmpdir(), `fc-shots-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

// DevTools 프로토콜 연결
let ws;
let seq = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = targets.find((t) => t.type === 'page');
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener('open', r, { once: true }));
      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
        }
      });
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Chrome에 연결하지 못했어요');
}
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

// 화면 크기: PC는 1280px × 2배, 휴대폰은 390px × 3배
async function viewport(kind) {
  if (kind === 'phone') await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  else await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 860, deviceScaleFactor: 2, mobile: false });
}
// 움직임 멈추기: 나타나기(.reveal)·떠다니기를 바로 보이는 상태로 (캡처가 흔들리지 않게)
// 코드 상자의 주소도 개발 서버(localhost) 대신 실제 사이트 주소로 보이게 바꾼다. (README 그림이니까)
const STILL = `(() => {
  const s = document.createElement('style'); s.textContent = '.js .reveal{opacity:1!important;transform:none!important} .toast{display:none!important}'; document.head.append(s);
  // (이미 바꾼 상자는 건드리지 않는다 — 바꾸는 것 자체가 다시 변화를 일으켜 끝없이 돌지 않게)
  const fix = () => { for (const pre of document.querySelectorAll('pre')) if (pre.textContent.includes(location.origin)) pre.textContent = pre.textContent.replaceAll(location.origin, 'https://fortune-commit.vercel.app'); };
  fix(); new MutationObserver(fix).observe(document.body, { subtree: true, childList: true, characterData: false });
})()`;

async function open(path, wait = 2500) {
  await send('Page.navigate', { url: BASE + path });
  await sleep(wait);
  await evaluate(STILL);
}
// 요소를 화면 가운데로 옮긴 뒤 그 영역만 찍는다 (pad: 둘레 여백)
async function shot(name, selector, { pad = 0, wait = 900, full = false, maxHeight = Infinity } = {}) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center' })`);
  await sleep(wait);
  const rect = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  rect.h = Math.min(rect.h, maxHeight); // 너무 긴 페이지는 윗부분만
  const clip = full ? { x: 0, y: rect.y - pad, width: await evaluate('innerWidth'), height: rect.h + pad * 2, scale: 1 }
    : { x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad), width: rect.w + pad * 2, height: rect.h + pad * 2, scale: 1 };
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  await writeFile(new URL(`${name}.png`, OUT), Buffer.from(data, 'base64'));
  console.log(`img/v3/${name}.png`);
}
// 지금 보이는 화면 그대로
async function screen(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL(`${name}.png`, OUT), Buffer.from(data, 'base64'));
  console.log(`img/v3/${name}.png`);
}

try {
  await mkdir(OUT, { recursive: true });
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');
  await viewport('pc');
  await open('/api/auth/login?next=/'); // 개발 서버: 바로 로그인

  // ---------- PC ----------
  await open('/');
  await shot('pc-hero', '.hero', { full: true });
  await shot('pc-daily', '#daily', { full: true });
  await shot('pc-takeout', '#takeout', { full: true });
  await shot('pc-friends', '#friends', { full: true });
  // 쿠키 열기 창·이야기·뽑기 연출은 움직이는 화면이라 readme-gifs.mjs가 GIF로 찍는다

  await open('/shop.html');
  // 상점·도감은 오른쪽 패널·분류 탭이 화면에 붙어 있어서(sticky) 보이는 화면 그대로 찍는다
  await evaluate('scrollTo(0, 0)');
  await sleep(400);
  await screen('pc-shop');

  await open('/collection.html', 3000);
  await evaluate('scrollTo(0, 0)');
  await sleep(400);
  await screen('pc-collection');
  await open('/skins.html#gacha-crown', 3000);
  await evaluate('scrollTo(0, 0)');
  await shot('pc-showcase', '.showcase', { full: true, wait: 600 });
  await open('/diary.html', 3000);
  await shot('pc-diary', 'body > .wrap', { full: true, wait: 300 });

  // ---------- 휴대폰 ----------
  await viewport('phone');
  await open('/', 2500);
  await screen('phone-home');
  await evaluate("document.getElementById('daily').scrollIntoView()");
  await sleep(900);
  await screen('phone-daily');
  await open('/shop.html', 3000);
  await screen('phone-shop');
  await open('/collection.html', 3000);
  await screen('phone-collection');
  await open('/skins.html', 3000);
  await evaluate("document.getElementById('santa').click()");
  await sleep(800);
  await screen('phone-showcase');
  await open('/diary.html', 3000);
  await screen('phone-diary');
} finally {
  ws?.close();
  chrome.kill();
  await sleep(300);
  await rm(profile, { recursive: true, force: true });
}
