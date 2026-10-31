// /api/daily: 매일 쌓이는 기록 (v3.2)
//   GET → { loggedIn, streak, bestStreak, todayDone, freezes, week: [도장 7개], heat: [잔디 35칸], quests, rewards, wallet }
// 로그인하지 않았으면 { loggedIn: false }만 돌려준다. (메인 화면은 예시를 보여준다)
// 냉동 쿠키 자동 사용, 연속 보너스·퀘스트 보상 지급은 src/account.js가 이 요청 안에서 한 번씩만 한다.

import { sessionLogin } from '../src/session.js';
import { todayIn } from '../src/pick.js';
import { loadAccount } from '../src/account.js';
import { sendJson } from '../src/http.js';

export default async function handler(req, res) {
  const login = sessionLogin(req);
  if (!login) {
    sendJson(res, 200, { loggedIn: false });
    return;
  }
  const account = await loadAccount(login, todayIn());
  sendJson(res, 200, { loggedIn: true, login, ...account.daily, next: account.next, rewards: account.rewards, wallet: account.wallet });
}
