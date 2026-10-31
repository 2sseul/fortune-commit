// 운세 문구 초안 검사기 (fortune-writer 스킬용)
// 사용법: 저장소 맨 위 폴더에서
//   node .claude/skills/fortune-writer/scripts/check-fortunes.mjs 초안.json
// 초안.json 모양: { "ko": ["...", ...], "en": ["...", ...] }
//   등급별이면 { "daegil": { "ko": [...], "en": [...] }, "hyung": {...} } 처럼 묶어도 된다.
//
// 검사하는 것
//   1. ko와 en 개수가 같은지 (같은 번호끼리 같은 뜻이어야 하므로)
//   2. 위젯 쪽지에서 3줄을 넘지 않는지 (src/wrap.js의 줄바꿈 계산을 그대로 씀)
//   3. 초안 안에서, 그리고 지금 src/의 문구들과 겹치거나 너무 비슷한지
//   4. 한국어 문구에 운세 표현('~거예요' 등)이 들어 있는지
// 문제가 있으면 목록을 보여주고 종료 코드 1로 끝난다.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const load = (file) => import(pathToFileURL(resolve(root, file)).href);
const { wrapText } = await load('src/wrap.js');

const MAX_WIDTH = 300; // tests/pick.test.js와 같은 값
const MAX_LINES = 3;
const SIMILAR = 0.8; // 글자 두 개씩 묶은 조각이 80% 넘게 같으면 '비슷함'

const file = process.argv[2];
if (!file) {
  console.error('사용법: node check-fortunes.mjs 초안.json');
  process.exit(2);
}
const draft = JSON.parse(readFileSync(resolve(root, file), 'utf8'));

// { ko, en } 묶음을 모두 찾아 [이름, 묶음] 목록으로 만든다.
function groups(node, name = '') {
  if (Array.isArray(node?.ko) || Array.isArray(node?.en)) return [[name || '(전체)', node]];
  return Object.entries(node ?? {}).flatMap(([key, value]) => groups(value, name ? `${name}.${key}` : key));
}

// 지금 저장소에 있는 문구 (겹침 검사용). 모양이 바뀌어도 문자열만 모은다.
function strings(node) {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(strings);
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}
const existing = [];
for (const path of ['src/fortunes.js', 'src/activity-fortunes.js']) {
  try {
    existing.push(...strings(Object.values(await load(path))));
  } catch {
    // 파일이 없거나 모양이 다르면 건너뛴다.
  }
}

const normalize = (text) => text.toLowerCase().replace(/[\s.,!?'"“”‘’…·~()-]/g, '');
function bigrams(text) {
  const s = normalize(text);
  const set = new Set();
  for (let i = 0; i < s.length - 1; i += 1) set.add(s.slice(i, i + 2));
  return set;
}
function similarity(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return normalize(a) === normalize(b) ? 1 : 0;
  let same = 0;
  for (const g of A) if (B.has(g)) same += 1;
  return (2 * same) / (A.size + B.size);
}

// 문장 안에 '오늘 ~할 거예요' 같은 운세 표현이 있어야 한다. (뒤에 '진짜로요.' 같은 한마디는 괜찮다)
const KO_FORTUNE = /(거예요|예정이에요|예정이래요|보여요|있어요|날이에요)/;
const problems = [];
let total = 0;
const seen = [];

for (const [name, group] of groups(draft)) {
  const ko = group.ko ?? [];
  const en = group.en ?? [];
  if (ko.length !== en.length) problems.push(`[개수] ${name}: ko ${ko.length}개, en ${en.length}개`);

  for (const [lang, list] of [['ko', ko], ['en', en]]) {
    list.forEach((text, i) => {
      total += 1;
      const where = `${name}.${lang}[${i}]`;
      const lines = wrapText(text, MAX_WIDTH).length;
      if (lines > MAX_LINES) problems.push(`[길이] ${where} ${lines}줄: ${text}`);
      if (lang === 'ko' && !KO_FORTUNE.test(text)) problems.push(`[말투] ${where} 운세 표현(~거예요)이 없음: ${text}`);

      for (const other of [...seen.filter((s) => s.lang === lang).map((s) => s.text), ...existing]) {
        const score = similarity(text, other);
        if (score >= SIMILAR) {
          problems.push(`[비슷함 ${Math.round(score * 100)}%] ${where}: ${text}\n      ↔ ${other}`);
          break;
        }
      }
      seen.push({ lang, text });
    });
  }
}

if (problems.length) {
  console.log(`문구 ${total}개 중 문제 ${problems.length}개\n`);
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`문구 ${total}개 모두 통과 (ko/en 개수, ${MAX_LINES}줄 이내, 겹침 없음, 말투)`);
