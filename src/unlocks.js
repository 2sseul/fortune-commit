// 스킨 해금 규칙 (v2)
// 올해 활동(src/github.js의 fetchYearActivity 결과)을 보고 스킨이 해금됐는지, 얼마나 남았는지 계산한다.
// 해금 기록을 저장하지 않고 매번 계산하므로, 해가 바뀌면 다시 모아야 한다.
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

// 위젯에 보여줄 진행 상황 문구 (예: 'cat 37/100 commits')
export function progressText(skinId, status) {
  return `${skinId} ${status.current}/${status.goal} ${status.unit}`.trim();
}
