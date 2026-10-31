// 개발용 가짜 GitHub 활동 (v3)
// 로컬에는 GITHUB_TOKEN이 없어서, `npm run dev`(FC_DEV=1)일 때만 이 값을 쓴다. 화면을 확인하려는 용도다.
// 올해 1월 1일부터 어제까지 거의 매일 기여, 최근 12일 연속, 오늘은 아직 커밋 전.

import { addDays } from './daily.js';

// FC_DEV_TODAY=3 처럼 주면 오늘 커밋한 상태(열린 쿠키)로 볼 수 있다.
const devToday = () => Number(process.env.FC_DEV_TODAY ?? 0);

export function devActivity() {
  return { today: devToday(), lastWeek: 18, language: 'JavaScript' };
}

export function devYear(date) {
  const days = {};
  const months = {};
  let d = `${date.slice(0, 4)}-01-01`;
  let i = 0;
  while (d <= date) {
    const recent = d >= addDays(date, -12);
    const count = d === date ? devToday() : d === addDays(date, -13) ? 0 : recent ? 1 + (i % 4) : (i * 7) % 5 === 0 ? 0 : (i % 6);
    days[d] = count;
    months[Number(d.slice(5, 7))] = (months[Number(d.slice(5, 7))] ?? 0) + count;
    d = addDays(d, 1);
    i += 1;
  }
  const total = Object.values(days).reduce((a, b) => a + b, 0);
  return {
    total, commits: Math.round(total * 0.8), prs: 12, reviews: 3, streak: 12, months, days,
    weekendDays: 40, bestDay: 9, fullMonths: 0,
    language: 'JavaScript', merged: 8, approvals: 4, stars: 6, forks: 1, newRepos: 2, legacy: 0, docker: 0,
    issueComments: 20, closedIssues: 4, late: 3, night: 12, friday: 0, fixes: 7,
  };
}
