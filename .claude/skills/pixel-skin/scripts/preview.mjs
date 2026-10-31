// 스킨 미리보기 페이지 만들기 (pixel-skin 스킨용)
// 사용법: npm run dev를 켠 상태에서, 저장소 맨 위 폴더에서
//   node .claude/skills/pixel-skin/scripts/preview.mjs <출력.html> [스킨 이름 ...]
// 스킨 이름을 안 주면 src/skins.js의 모든 스킨을 보여준다.
//
// 스킨 하나마다 확인해야 할 모습을 한 줄에 모은다.
//   위젯: 다크·잠김 / 다크·열림 / 라이트·잠김 / 라이트·열림  (README에서 보이는 모습)
//   사이트: 진열대 그림(still) / 캐릭터 얼굴(face) / 원본 그림(img/<이름>-fortune-cookie.png, 있으면)
// 라이트·잠김에서 흰색·밝은 색 부분이 바탕에 묻히지 않는지 특히 본다. (예전 산타 흰 털 문제)

import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const [out, ...names] = process.argv.slice(2);
if (!out) {
  console.error('사용법: node preview.mjs <출력.html> [스킨 이름 ...]');
  process.exit(2);
}
const { SKINS } = await import(pathToFileURL(resolve(root, 'src/skins.js')).href);
const ids = names.length ? names : Object.keys(SKINS);
const unknown = ids.filter((id) => !SKINS[id]);
if (unknown.length) console.warn(`src/skins.js에 없는 스킨: ${unknown.join(', ')} (기본 쿠키로 보일 거예요)`);

const base = process.env.PREVIEW_ORIGIN || 'http://localhost:3000';
const cell = (label, src, bg = '#fff8ee') =>
  `<figure style="background:${bg}"><img src="${src}" loading="lazy"><figcaption>${label}</figcaption></figure>`;

const rows = ids.map((id) => {
  const widget = (theme, preview) => `${base}/api?skin=${id}&preview=${preview}&theme=${theme}&t=${Date.now()}`;
  const original = resolve(root, `img/${id}-fortune-cookie.png`);
  return `<section><h2>${id} · ${SKINS[id]?.label?.ko ?? '?'}</h2><div class="row">
    ${cell('다크·잠김', widget('dark', 'locked'), '#0d1117')}
    ${cell('다크·열림', widget('dark', 'open'), '#0d1117')}
    ${cell('라이트·잠김', widget('light', 'locked'), '#ffffff')}
    ${cell('라이트·열림', widget('light', 'open'), '#ffffff')}
    ${cell('진열대', `${base}/api/cookie?skin=${id}&mode=still`)}
    ${cell('캐릭터', `${base}/api/cookie?skin=${id}&mode=still&face=1`)}
    ${existsSync(original) ? cell('원본 그림', pathToFileURL(original).href) : ''}
  </div></section>`;
});

writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>스킨 미리보기</title>
<style>
  body { font-family: sans-serif; margin: 16px; background: #eee; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; }
  figure { margin: 0; padding: 8px; border-radius: 8px; }
  figure img { display: block; height: 180px; image-rendering: pixelated; }
  figcaption { font-size: 12px; color: #888; text-align: center; }
</style>
<h1>스킨 미리보기 (${base})</h1>
${rows.join('\n')}`);
console.log(`미리보기 페이지: ${resolve(out)} (스킨 ${ids.length}개)`);
