// 로그인한 사람의 모든 기록을 한 번에 불러온다 (v3)
// 상점·도감·매일 기록·뽑기 API가 같은 계산을 쓰도록 한곳에 모았다.
//   - 올해 활동 + 사이트 기록(연속 기록, 위젯 단 날) → 쿠키 65종 해금 상태
//   - 연속 기록 계산, 필요하면 냉동 쿠키 자동 사용
//   - 연속 보너스·퀘스트 보상 자동 지급 (한 번씩만)
//   - 지갑 (포인트, 부스러기, 뽑기권, 냉동 쿠키)

import { COOKIES } from './cookie-catalog.js';
import { fetchActivity, fetchYearActivity } from './github.js';
import {
  getProfile, getWalletRecord, addEarnedSkins, getFreezes, useFreezes, getClaimed, grantOnce, markSince,
} from './store.js';
import { skinStatus, newlyEarned, withSiteStats, UNLOCK_RULES, GACHA_COOKIES } from './unlocks.js';
import { computeStreak, dueBonuses, dailyQuests, weekStamps, heatGrid } from './daily.js';
import { wallet as makeWallet } from './shop.js';

// 쿠키 하나의 상태: 해금(업적·뽑기·구매) 여부와 진행 상황
function cookieStates(year, profile) {
  const owned = new Set(profile?.owned ?? []);
  const earned = new Set(profile?.earned ?? []);
  return COOKIES.map(({ id }) => {
    const status = year ? skinStatus(id, year) : { unlocked: id === 'plain', current: 0, goal: UNLOCK_RULES[id]?.goal ?? 1, unit: '' };
    const bought = owned.has(`skin:${id}`);
    const kept = earned.has(id) && !status.unlocked;
    return { id, current: status.current, goal: status.goal, unit: status.unit, unlocked: status.unlocked || bought || earned.has(id), bought, kept };
  });
}

// 가장 가까운 잠긴 쿠키 (진행률이 가장 높은 것, 뽑기 쿠키와 0%는 뺀다)
function nextUnlock(states) {
  const label = Object.fromEntries(COOKIES.map((c) => [c.id, c.label]));
  return states
    .filter((s) => !s.unlocked && !GACHA_COOKIES.includes(s.id) && s.goal > 1 && s.current > 0)
    .sort((a, b) => b.current / b.goal - a.current / a.goal)
    .slice(0, 2)
    .map((s) => ({ id: s.id, label: label[s.id], current: s.current, goal: s.goal }));
}

export async function loadAccount(login, date) {
  const yearKey = date.slice(0, 4);
  const [rawYear, record, profile, activity, freezeInfo, claimed, since] = await Promise.all([
    fetchYearActivity({ login, date }),
    getWalletRecord(login, { year: yearKey, date }),
    getProfile(login),
    fetchActivity({ login, date }),
    getFreezes(login),
    getClaimed(login, yearKey),
    markSince(login, date),
  ]);

  // 연속 기록 (빼먹은 날이 있으면 냉동 쿠키를 쓴다)
  const days = rawYear?.days ?? {};
  const streak = computeStreak({ days, today: date, todayCount: activity?.today ?? 0, ...freezeInfo });
  if (streak.use.length && (await useFreezes(login, streak.use))) {
    for (const [day, bought] of streak.use) {
      freezeInfo.frozen.add(day);
      freezeInfo.freezes.splice(freezeInfo.freezes.indexOf(bought), 1);
    }
  }
  const bestStreak = Math.max(rawYear?.streak ?? 0, streak.current);
  const year = withSiteStats(rawYear, { login, date, bestStreak, since });

  // 해금 상태 (새로 해금한 쿠키는 영원히 기록)
  const fresh = year && profile ? newlyEarned({ year, profile }) : [];
  if (fresh.length) await addEarnedSkins(login, fresh);
  const fullProfile = profile ? { ...profile, earned: [...(profile.earned ?? []), ...fresh] } : null;
  const cookies = cookieStates(year, fullProfile);
  const next = nextUnlock(cookies);

  // 보상 자동 지급: 연속 보너스, 오늘 커밋 퀘스트, 연속 기록 퀘스트
  const quests = dailyQuests({ todayDone: streak.todayDone, attendedToday: record?.attendedToday, streak: streak.current, next: next[0] });
  let granted = 0;
  const rewards = [];
  if (record) {
    for (const { days: n, points } of dueBonuses(streak.current, claimed.filter((c) => c.startsWith('streak:')).map((c) => c.slice(7)))) {
      if (await grantOnce(login, { year: yearKey, rewardKey: `streak:${n}`, points })) { granted += points; rewards.push({ kind: 'streak', days: Number(n), points }); }
    }
    for (const quest of quests.filter((q) => q.done && typeof q.reward === 'number' && q.auto !== false)) {
      if (await grantOnce(login, { year: yearKey, rewardKey: `quest:${date}:${quest.id}`, points: quest.reward })) { granted += quest.reward; rewards.push({ kind: 'quest', id: quest.id, points: quest.reward }); }
    }
  }

  const wallet = record && year
    ? { ...makeWallet({ contributions: year.total, attendance: record.attendance, spent: record.spent, bonus: record.bonus + granted }),
      attendance: record.attendance, attendedToday: record.attendedToday, crumbs: record.crumbs, tickets: record.tickets, freezes: freezeInfo.freezes.length }
    : null;

  return {
    login,
    date,
    year,
    profile: fullProfile,
    activity,
    cookies,
    next,
    wallet,
    rewards,
    daily: {
      streak: streak.current,
      bestStreak,
      openDays: Object.values(days).filter((n) => n > 0).length + (streak.todayDone && !(days[date] > 0) ? 1 : 0), // 올해 쿠키를 연 날
      since: since ?? date,
      todayDone: streak.todayDone,
      freezes: freezeInfo.freezes.length,
      week: weekStamps({ days, today: date, todayDone: streak.todayDone, frozen: freezeInfo.frozen }),
      heat: heatGrid({ days, today: date, todayCount: activity?.today ?? 0 }),
      quests: quests.map((q) => ({ ...q, claimed: q.done && (claimed.includes(`quest:${date}:${q.id}`) || rewards.some((r) => r.id === q.id)) })),
    },
  };
}
