// 스킨 해금 규칙 (v2)
// 올해 활동(src/github.js의 fetchYearActivity 결과)을 보고 스킨이 해금됐는지, 얼마나 남았는지 계산한다.
// 해금은 올해 활동으로 계산하고, 한 번 해금한 스킨은 DB(earned)에 기록해 해가 바뀌어도 계속 쓸 수 있다. (v2.2)
//
// 규칙 하나는 이렇게 생겼다.
//   goal    : 목표 숫자
//   unit    : 진행 상황에 붙일 단위 (위젯에 'cat 37/100 commits'처럼 보인다)
//   measure : 올해 활동에서 지금 숫자를 꺼내는 함수

export const UNLOCK_RULES = {
  plain: { goal: 0, unit: '', measure: () => 0 },
  choco: { goal: 50, unit: 'contributions', measure: (y) => y.total },
  matcha: { goal: 150, unit: 'contributions', measure: (y) => y.total },
  gold: { goal: 7, unit: 'day streak', measure: (y) => y.streak },
  cat: { goal: 100, unit: 'commits', measure: (y) => y.commits },
  dog: { goal: 10, unit: 'PRs', measure: (y) => y.prs },
  rabbit: { goal: 10, unit: 'reviews', measure: (y) => y.reviews },
  pumpkin: { goal: 10, unit: 'in October', measure: (y) => y.months[10] ?? 0 },
  snowman: { goal: 10, unit: 'in December', measure: (y) => y.months[12] ?? 0 },
  deer: { goal: 30, unit: 'in December', measure: (y) => y.months[12] ?? 0 },
  // 크리스마스 당일에 기여가 하나라도 있으면 해금
  santa: { goal: 1, unit: 'on Dec 25', measure: (y) => Math.min(1, christmasCount(y)) },
};

// 올해 12월 25일의 기여 수
function christmasCount(year) {
  const christmas = Object.keys(year.days).find((date) => date.endsWith('-12-25'));
  return christmas ? year.days[christmas] : 0;
}

// 스킨의 해금 상태를 돌려준다.
//   { unlocked: true/false, current: 지금 숫자, goal: 목표, unit: 단위 }
// year가 없으면(확인 실패) 위젯이 깨지지 않게 해금된 것으로 본다.
export function skinStatus(skinId, year) {
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
