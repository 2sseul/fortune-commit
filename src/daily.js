// 매일 쌓이는 기록: 연속 기록, 냉동 쿠키, 이번 주 도장, 잔디, 오늘의 퀘스트 (v3.2)
// DB를 건드리지 않는 계산만 모아 둔다. (저장은 src/store.js, 요청 처리는 api/daily.js)
//
// 연속 기록 = 쿠키가 열린 날(그날 기여가 있는 날)이 끊기지 않고 이어진 날 수
//   - 오늘은 아직 끝나지 않았으므로, 오늘 기여가 없어도 어제까지 이어졌으면 기록이 살아 있다.
//   - 냉동 쿠키: 빼먹은 날 하나를 이어 준다. 빼먹은 날보다 먼저 산 냉동 쿠키만 쓸 수 있다.
//     빈 날 뒤(더 옛날)에 기여한 날이 있어서 실제로 이어 줄 때만 쓴다. (긴 공백에 낭비하지 않게)

const DAY_MS = 24 * 60 * 60 * 1000;
export const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

// 연속 보너스: 이어진 날 → 포인트 (그해에 한 번씩)
export const STREAK_BONUS = { 7: 100, 30: 500, 100: 2000, 365: 10000 };
export const FREEZE_MAX = 2;

// days: 날짜별 기여 수, today: 오늘 날짜, todayCount: 오늘 활동 수(잔디보다 빠름)
// frozen: 냉동 쿠키로 이미 이은 날짜 집합, freezes: 갖고 있는 냉동 쿠키의 산 날짜 목록
// 돌려주는 값: { current, todayDone, use: [새로 냉동 쿠키를 쓸 날짜, 쓸 냉동 쿠키(산 날짜)] }
export function computeStreak({ days, today, todayCount = 0, frozen = new Set(), freezes = [] }) {
  const active = (date) => (days[date] ?? 0) > 0 || frozen.has(date);
  const todayDone = (days[today] ?? 0) > 0 || todayCount > 0;
  const left = [...freezes].sort(); // 오래된 냉동 쿠키부터 쓴다
  const use = [];
  let current = todayDone ? 1 : 0;
  let date = addDays(today, -1);
  while (date in days || frozen.has(date)) {
    if (active(date)) {
      current += 1;
      date = addDays(date, -1);
      continue;
    }
    // 빈 날이 이어진 구간을 찾아, 그 앞(옛날 쪽)이 기여한 날이고 냉동 쿠키가 충분하면 이어 준다.
    const gap = [];
    let d = date;
    while (d in days && !active(d)) { gap.push(d); d = addDays(d, -1); }
    if (!(d in days)) break; // 데이터 밖까지 비어 있으면 이을 기록이 없다
    if (gap.length > left.length || gap.some((g) => !left.some((bought) => bought <= g))) break;
    for (const g of gap) {
      const i = left.findIndex((bought) => bought <= g);
      use.push([g, left[i]]);
      left.splice(i, 1);
      current += 1;
    }
    date = d;
  }
  return { current, todayDone, use };
}

// 이번 주(월~일) 도장: done(연 날) / frozen(냉동 쿠키) / missed(빼먹음) / today / future
export function weekStamps({ days, today, todayDone, frozen = new Set() }) {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // 월요일 = 0
  const monday = addDays(today, -weekday);
  return ['월', '화', '수', '목', '금', '토', '일'].map((label, i) => {
    const date = addDays(monday, i);
    let state = 'future';
    if (date === today) state = todayDone ? 'done' : 'today';
    else if (date < today) state = (days[date] ?? 0) > 0 ? 'done' : frozen.has(date) ? 'frozen' : 'missed';
    return { date, label, state, today: date === today };
  });
}

// 연속 기록 카드의 잔디: 최근 5주(월~일 × 5줄), 칸마다 0~3단계
export function heatGrid({ days, today, todayCount = 0 }) {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(today, -weekday - 28);
  return Array.from({ length: 35 }, (_, i) => {
    const date = addDays(start, i);
    const count = date === today ? Math.max(days[date] ?? 0, todayCount) : days[date] ?? 0;
    const level = date > today ? -1 : count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3;
    return { date, level, today: date === today };
  });
}

// 오늘의 퀘스트 (매일 같은 네 가지, 보상은 서버가 자동으로 준다)
//   next: 가장 가까운 잠긴 쿠키 { id, label, current, goal }
export function dailyQuests({ todayDone, attendedToday, streak, next }) {
  const quests = [
    { id: 'commit', icon: 'flame', label: '오늘 커밋하기', current: todayDone ? 1 : 0, goal: 1, reward: 10 },
    { id: 'open', icon: 'cookie', label: '사이트에서 쿠키 열기', current: attendedToday ? 1 : 0, goal: 1, reward: 30, auto: false },
    { id: 'streak', icon: 'calendar', label: `연속 기록 ${todayDone ? streak : streak + 1}일 만들기`, current: todayDone ? streak : streak, goal: todayDone ? streak : streak + 1, reward: 50 },
  ];
  if (next) quests.splice(2, 0, { id: 'unlock', icon: 'cookie', cookie: next.id, label: `${next.label}까지`, current: next.current, goal: next.goal, reward: 'cookie' });
  return quests.map((q) => ({ ...q, done: q.current >= q.goal }));
}

// 아직 못 받은 연속 보너스 (claimed: 그해에 이미 받은 기준 목록)
export function dueBonuses(streak, claimed = []) {
  return Object.entries(STREAK_BONUS)
    .filter(([days]) => streak >= Number(days) && !claimed.includes(days))
    .map(([days, points]) => ({ days, points }));
}
