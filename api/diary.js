// /api/diary: 운세 일기 (v3.2)
//   GET ?year=2026 → { loggedIn, year, days: { 날짜: 기여 수 }, entries: { 날짜: { fortune, grade } }, frozen, streak }
// 쿠키를 연 날(그날 기여가 있는 날)은 도장, 사이트에서 운세를 본 날은 그 운세 문장까지 남는다.

import { sessionLogin } from '../src/session.js';
import { todayIn, fortuneGrade } from '../src/pick.js';
import { loadAccount } from '../src/account.js';
import { getDiary, getFreezes } from '../src/store.js';
import { sendJson } from '../src/http.js';

export default async function handler(req, res) {
  const login = sessionLogin(req);
  if (!login) {
    sendJson(res, 200, { loggedIn: false });
    return;
  }
  const today = todayIn();
  const [account, entries, { frozen }] = await Promise.all([loadAccount(login, today), getDiary(login, today.slice(0, 4)), getFreezes(login)]);
  const days = Object.fromEntries(Object.entries(account.year?.days ?? {}).filter(([date]) => date <= today && date.startsWith(today.slice(0, 4)))); // 일기는 올해
  // 등급은 아이디 + 날짜로 정해지므로, 기록이 없는 날도 쿠키를 연 날이면 등급을 보여줄 수 있다.
  const grades = Object.fromEntries(Object.entries(days).filter(([, n]) => n > 0).map(([date]) => [date, fortuneGrade(login, date)]));
  sendJson(res, 200, {
    loggedIn: true, login, today, days, grades, entries: entries ?? {}, frozen: [...frozen],
    streak: account.daily.streak, bestStreak: account.daily.bestStreak, balance: account.wallet?.balance ?? null,
  });
}
