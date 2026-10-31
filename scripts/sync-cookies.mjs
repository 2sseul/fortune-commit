// 디자인 폴더(design/)의 쿠키·그림을 사이트와 서버가 쓰는 곳으로 옮긴다. (v3)
//   node scripts/sync-cookies.mjs
//
// design/ 은 그림을 만드는 곳이고, 배포되는 것은 public/(사이트)과 src/(서버)다.
// 쿠키를 새로 그리거나 고친 뒤(pixel-skin 스킬) 이 스크립트를 돌리면 아래가 함께 바뀐다.
//   public/cookies/<이름>.svg      사이트에서 쓰는 벡터 쿠키 (상점 아이템 아이콘 item-* 포함)
//   public/cookies/catalog.json    사이트가 읽는 쿠키 목록 (이름·분류·해금 조건·뽑기 등급)
//   public/img/illust/*.svg        캐릭터·마스코트 일러스트
//   public/img/icons/*.svg         아이콘
//   src/cookie-catalog.js          서버가 읽는 쿠키 목록·뽑기 설정·아이템 가격
//   src/pixel-maps.js              위젯이 그리는 픽셀 쿠키 지도 (to_pixel.py 결과)

import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const at = (path) => new URL(path, root);

const catalog = JSON.parse(await readFile(at('design/cookies/catalog.json'), 'utf8'));

// 1) 벡터 쿠키
await mkdir(at('public/cookies/'), { recursive: true });
const svgs = (await readdir(at('design/cookies/'))).filter((name) => name.endsWith('.svg') && name !== 'pixel-plain.svg');
for (const name of svgs) await copyFile(at(`design/cookies/${name}`), at(`public/cookies/${name}`));

// 2) 일러스트와 아이콘
for (const [from, to] of [['design/illustrations/', 'public/img/illust/'], ['design/icons/', 'public/img/icons/']]) {
  await mkdir(at(to), { recursive: true });
  for (const name of (await readdir(at(from))).filter((n) => n.endsWith('.svg'))) await copyFile(at(from + name), at(to + name));
}

// 3) 쿠키 목록 (사이트용 JSON, 서버용 JS)
const cookies = catalog.cookies.map(({ id, label, category, rarity, unlock, data }) => ({ id, label, category, ...(rarity ? { rarity } : {}), unlock, data }));
const site = { cookies, gacha: catalog.gacha, items: Object.fromEntries(Object.entries(catalog.items).map(([id, { label, price, max }]) => [id, { label, price, ...(max ? { max } : {}) }])) };
await writeFile(at('public/cookies/catalog.json'), `${JSON.stringify(site, null, 1)}\n`);
await writeFile(at('src/cookie-catalog.js'), [
  '// 쿠키 65종 목록, 뽑기 설정, 상점 아이템 (v3)',
  '// 이 파일은 scripts/sync-cookies.mjs가 design/cookies/catalog.json에서 만든다. 직접 고치지 말고 catalog.json을 고친 뒤 다시 만든다.',
  `export const COOKIES = ${JSON.stringify(cookies, null, 1)};`,
  `export const GACHA = ${JSON.stringify(catalog.gacha, null, 1)};`,
  `export const ITEMS = ${JSON.stringify(site.items, null, 1)};`,
  '',
].join('\n\n'));

// 4) 위젯 픽셀 지도
const maps = {};
for (const name of (await readdir(at('design/cookies/pixel/'))).filter((n) => n.endsWith('.json')).sort()) {
  const { palette, map } = JSON.parse(await readFile(at(`design/cookies/pixel/${name}`), 'utf8'));
  maps[name.slice(0, -5)] = { palette, map };
}
await writeFile(at('src/pixel-maps.js'), [
  '// 위젯용 픽셀 쿠키 지도 (v3)',
  '// scripts/sync-cookies.mjs가 design/cookies/pixel/*.json(to_pixel.py가 벡터에서 자동 변환한 것)에서 만든다. 직접 고치지 않는다.',
  '// 지도 글자: 대문자 = 앞 조각, 소문자 = 뒤 날개, . = 빈칸. palette는 대문자 글자의 색이다.',
  `export const PIXEL_MAPS = ${JSON.stringify(maps)};`,
  '',
].join('\n\n'));

console.log(`벡터 ${svgs.length}개, 목록 ${cookies.length}종, 픽셀 지도 ${Object.keys(maps).length}개를 옮겼어요.`);
