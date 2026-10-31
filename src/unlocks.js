// 스킨 해금 규칙 (v2)
// 올해 활동(src/github.js의 fetchYearActivity 결과)을 보고 스킨이 해금됐는지, 얼마나 남았는지 계산한다.
// 해금은 올해 활동으로 계산하고, 한 번 해금한 스킨은 DB(earned)에 기록해 해가 바뀌어도 계속 쓸 수 있다. (v2.2)
//
// 규칙 하나는 이렇게 생겼다.
//   goal    : 목표 숫자
//   unit    : 진행 상황에 붙일 단위 (위젯에 'cat 37/100 commits'처럼 보인다)
//   measure : 올해 활동에서 지금 숫자를 꺼내는 함수

import { COOKIES } from './cookie-catalog.js';
import { fortuneGrade } from './pick.js';

const month = (m) => (y) => y.months[m] ?? 0;
const onDay = (mmdd) => (y) => Math.min(1, Object.entries(y.days).find(([date]) => date.endsWith(mmdd))?.[1] ?? 0);

// 언어 쿠키: 올해 그 언어 저장소에 커밋 50개 (v3, 여러 언어를 모두 열 수 있다)
//   예전 규칙(주 언어 하나 + 기여 100)은 언어 쿠키를 하나만 열 수 있어서 바꿨다.
export const LANGUAGE_COOKIES = {
  crab: 'Rust', python: 'Python', coffee: 'Java', javascript: 'JavaScript', typescript: 'TypeScript',
  go: 'Go', kotlin: 'Kotlin', swift: 'Swift', cpp: 'C++', csharp: 'C#', ruby: 'Ruby', php: 'PHP',
  dart: 'Dart', shell: 'Shell', haskell: 'Haskell',
};
export const LANGUAGE_GOAL = 50;
const language = (name) => ({ goal: LANGUAGE_GOAL, unit: `${name} commits`, measure: (y) => y.languageCommits?.[name] ?? 0 });

export const UNLOCK_RULES = {
  plain: { goal: 0, unit: '', measure: () => 0 },
  choco: { goal: 50, unit: 'contributions', measure: (y) => y.total },
  matcha: { goal: 150, unit: 'contributions', measure: (y) => y.total },
  gold: { goal: 7, unit: 'day streak', measure: (y) => y.streak },
  cat: { goal: 100, unit: 'commits', measure: (y) => y.commits },
  dog: { goal: 10, unit: 'PRs', measure: (y) => y.prs },
  rabbit: { goal: 10, unit: 'reviews', measure: (y) => y.reviews },
  pumpkin: { goal: 10, unit: 'in October', measure: month(10) },
  snowman: { goal: 10, unit: 'in December', measure: month(12) },
  deer: { goal: 30, unit: 'in December', measure: month(12) },
  // 크리스마스 당일에 기여가 하나라도 있으면 해금
  santa: { goal: 1, unit: 'on Dec 25', measure: (y) => Math.min(1, christmasCount(y)) },

  // v3 활동 쿠키
  owl: { goal: 10, unit: 'commits after midnight', measure: (y) => y.late ?? 0 },
  weekend: { goal: 20, unit: 'weekend days', measure: (y) => y.weekendDays ?? 0 },
  merge: { goal: 10, unit: 'merged PRs', measure: (y) => y.merged ?? 0 },
  streak: { goal: 30, unit: 'day streak', measure: (y) => Math.max(y.streak, y.bestStreak ?? 0) },
  // v3 시즌 쿠키
  sakura: { goal: 10, unit: 'in April', measure: month(4) },
  watermelon: { goal: 10, unit: 'in August', measure: month(8) },
  maple: { goal: 10, unit: 'in November', measure: month(11) },
  // v3 언어 쿠키
  ...Object.fromEntries(Object.entries(LANGUAGE_COOKIES).map(([id, name]) => [id, language(name)])),
  // v3 개발자 밈 쿠키
  grass: { goal: 365, unit: 'contributions', measure: (y) => y.total },
  lgtm: { goal: 30, unit: 'approvals', measure: (y) => y.approvals ?? 0 },
  star: { goal: 10, unit: 'stars', measure: (y) => y.stars ?? 0 },
  fork: { goal: 5, unit: 'forks', measure: (y) => y.forks ?? 0 },
  hotfix: { goal: 10, unit: 'fix commits', measure: (y) => y.fixes ?? 0 },
  404: { goal: 1, unit: 'on Apr 1', measure: onDay('-04-01') },
  null: { goal: 30, unit: 'empty days', measure: (y) => y.emptyDays ?? 0 },
  duck: { goal: 50, unit: 'issue comments', measure: (y) => y.issueComments ?? 0 },
  infinite: { goal: 100, unit: 'day streak', measure: (y) => Math.max(y.streak, y.bestStreak ?? 0) },
  semicolon: { goal: 1000, unit: 'contributions', measure: (y) => y.total },
  stackoverflow: { goal: 20, unit: 'in one day', measure: (y) => y.bestDay ?? 0 },
  legacy: { goal: 1, unit: 'legacy repo', measure: (y) => y.legacy ?? 0 },
  darkmode: { goal: 30, unit: 'commits after 10pm', measure: (y) => y.night ?? 0 },
  keycap: { goal: 1, unit: 'full month', measure: (y) => y.fullMonths ?? 0 },
  friday: { goal: 1, unit: 'Friday night push', measure: (y) => y.friday ?? 0 },
  docker: { goal: 1, unit: 'Dockerfile repo', measure: (y) => y.docker ?? 0 },
  galaxy: { goal: 1, unit: 'legendary fortune', measure: (y) => y.legendDays ?? 0 },
  bug: { goal: 10, unit: 'closed issues', measure: (y) => y.closedIssues ?? 0 },
  retro: { goal: 365, unit: 'days with widget', measure: (y) => y.widgetDays ?? 0 },
  helloworld: { goal: 1, unit: 'new repo', measure: (y) => y.newRepos ?? 0 },
};

// 뽑기 쿠키: 활동으로는 열리지 않고, 뽑기나 부스러기 교환으로만 얻는다. (기록은 earned에)
export const GACHA_COOKIES = COOKIES.filter((cookie) => cookie.category === '뽑기').map((cookie) => cookie.id);

// 사이트 기록으로 계산하는 숫자를 올해 활동에 더한다. (v3)
//   login       : 아이디 (전설 운세 날 계산), date: 오늘
//   bestStreak  : 사이트가 계산한 가장 긴 연속 기록 (냉동 쿠키 포함), since: 위젯을 처음 본 날
export function withSiteStats(year, { login, date, bestStreak = 0, since = null }) {
  if (!year) return year;
  const days = Object.entries(year.days).filter(([day]) => day <= date);
  const emptyDays = days.filter(([, count]) => count === 0).length;
  const legendDays = login ? days.filter(([day, count]) => count > 0 && fortuneGrade(login, day) === 'legend').length : 0;
  const widgetDays = since ? Math.floor((Date.parse(date) - Date.parse(since)) / 86400000) : 0;
  return { ...year, emptyDays, legendDays, bestStreak, widgetDays };
}

// 올해 12월 25일의 기여 수
function christmasCount(year) {
  const christmas = Object.keys(year.days).find((date) => date.endsWith('-12-25'));
  return christmas ? year.days[christmas] : 0;
}

// 스킨의 해금 상태를 돌려준다.
//   { unlocked: true/false, current: 지금 숫자, goal: 목표, unit: 단위 }
// year가 없으면(확인 실패) 위젯이 깨지지 않게 해금된 것으로 본다.
export function skinStatus(skinId, year) {
  if (GACHA_COOKIES.includes(skinId)) return { unlocked: false, current: 0, goal: 1, unit: 'gacha', gacha: true };
  const rule = UNLOCK_RULES[skinId] ?? UNLOCK_RULES.plain;
  if (!year || rule.goal === 0) return { unlocked: true, current: rule.goal, goal: rule.goal, unit: rule.unit };
  const current = rule.measure(year);
  return { unlocked: current >= rule.goal, current: Math.min(current, rule.goal), goal: rule.goal, unit: rule.unit };
}

// 이 사람이 쓸 수 있는 스킨인지: 올해 업적, 예전에 해금한 기록(earned), 상점에서 산 것(owned) 중 하나 (v2.2)
//   profile: src/store.js의 getProfile 결과 (없으면 올해 업적만 본다)
//   year가 없으면(확인 실패) 기록만 본다. (skinStatus와 달리 '해금된 것으로 보기'를 하지 않는다)
export function hasSkin(skinId, { year, profile }) {
  if (skinId === 'plain') return true;
  if (profile?.earned?.includes(skinId) || profile?.owned?.includes(`skin:${skinId}`)) return true;
  return year ? skinStatus(skinId, year).unlocked : false;
}

// 올해 업적으로 해금했지만 아직 영원히 기록하지 않은 스킨 목록 (year가 없으면 기록하지 않는다)
export function newlyEarned({ year, profile }) {
  if (!year) return [];
  const earned = new Set(profile?.earned ?? []);
  return Object.keys(UNLOCK_RULES).filter((id) => id !== 'plain' && !earned.has(id) && skinStatus(id, year).unlocked);
}

// 위젯에 보여줄 진행 상황 문구 (예: 'cat 37/100 commits')
export function progressText(skinId, status) {
  return `${skinId} ${status.current}/${status.goal} ${status.unit}`.trim();
}
