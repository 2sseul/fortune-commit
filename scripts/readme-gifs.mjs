// README용 움직이는 화면 GIF (첫 화면 캐릭터, 이야기, 쿠키 열기, 뽑기 연출)
//   1) 개발 서버를 켠다:  DEV_LOGIN=2sseul FC_DEV_TODAY=2 PORT=3999 npm run dev
//   2) 이 스크립트:      node scripts/readme-gifs.mjs [http://localhost:3999]
//   → img/v3/*.gif   (프레임은 Chrome 화면 녹화(screencast)로 받고, GIF로 묶는 건 Python Pillow)
//
// 스크린샷 스크립트(readme-shots.mjs)와 같은 방식으로 Chrome을 원격 조종한다.

import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://localhost:3999';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = fileURLToPath(new URL('../img/v3/', import.meta.url));
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const work = join(tmpdir(), `fc-gifs-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(work, 'profile')}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

let ws;
let seq = 0;
const pending = new Map();
let onFrame = null;
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page');
      ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((r) => ws.addEventListener('open', r, { once: true }));
      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.screencastFrame') {
          send('Page.screencastFrameAck', { sessionId: msg.params.sessionId });
          onFrame?.(msg.params);
        } else if (msg.id && pending.has(msg.id)) {
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
const STILL = `(() => { const s = document.createElement('style'); s.textContent = '.js .reveal{opacity:1!important;transform:none!important} .toast{display:none!important}'; document.head.append(s); })()`;
async function open(path, wait = 2500) {
  await send('Page.navigate', { url: BASE + path });
  await sleep(wait);
  await evaluate(STILL);
}
// 요소 위치(화면 기준, CSS px)
const rectOf = (selector) => evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);

// seconds초 동안 화면을 녹화해서 selector 영역만 잘라 GIF로 만든다. action: 녹화를 시작한 뒤 할 일
async function record(name, selector, seconds, { action, pad = 0, width = 760 } = {}) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center' })`);
  await sleep(600);
  // (dialog는 scrollIntoView가 필요 없지만 해도 괜찮다)
  const dir = join(work, name);
  await mkdir(dir, { recursive: true });
  const frames = [];
  onFrame = (frame) => frames.push(frame);
  await send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  const started = Date.now();
  if (action) await action();
  const rect = await rectOf(selector);
  while (Date.now() - started < seconds * 1000) await sleep(50);
  await send('Page.stopScreencast');
  onFrame = null;
  const list = [];
  for (const [i, frame] of frames.entries()) {
    const file = join(dir, `${String(i).padStart(4, '0')}.png`);
    await writeFile(file, Buffer.from(frame.data, 'base64'));
    list.push([file, frame.metadata.timestamp, frame.metadata.deviceWidth, frame.metadata.offsetTop ?? 0]);
  }
  await writeFile(join(dir, 'frames.json'), JSON.stringify({ list, crop: [rect.x - pad, rect.y - pad, rect.x + rect.w + pad, rect.y + rect.h + pad], width }));
  execFileSync('python3', [fileURLToPath(new URL('./frames-to-gif.py', import.meta.url)), join(dir, 'frames.json'), join(OUT, `${name}.gif`)], { stdio: 'inherit' });
}

try {
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 860, deviceScaleFactor: 2, mobile: false });
  await open('/api/auth/login?next=/');
  await open('/');
  await evaluate('localStorage.clear()');
  await record('gif-hero', '.hero-art', 5, { width: 640 });
  await record('gif-story', '.steps', 4.6, { width: 900 });
  // 쿠키 열기: 창을 먼저 열고(오늘 아직 안 연 상태여야 흔들기부터 보인다 — 개발 서버를 새로 켜고 돌릴 것) 녹화
  await evaluate("document.getElementById('open-cookie').click()");
  await sleep(700);
  await record('gif-fortune', '#fortune-dialog', 3.4, {
    pad: 12,
    width: 420,
    action: async () => { await sleep(300); await evaluate("document.getElementById('fortune-cookie').click()"); },
  });
  await open('/shop.html', 3000);
  await evaluate("document.getElementById('gacha').scrollIntoView({ block: 'center' })");
  await evaluate("document.getElementById('draw-10').click()");
  await sleep(1200);
  await record('gif-gacha', '#sheet', 5.2, {
    pad: 12,
    width: 480,
    action: async () => { await sleep(700); await evaluate("document.querySelector('.open-btn').click()"); },
  });
} finally {
  ws?.close();
  chrome.kill();
  await sleep(300);
  await rm(work, { recursive: true, force: true });
}
