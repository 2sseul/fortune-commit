// /api/gacha: 쿠키 뽑기 (v3.3)
//   POST { action: 'draw', count: 1 | 10 }      1회 150P(뽑기권이 있으면 뽑기권), 10회 1,350P
//   POST { action: 'exchange', cookie: 'gacha-crown' }  부스러기로 원하는 뽑기 쿠키 받기
// 어떤 쿠키가 나올지는 서버에서 정한다. (crypto 난수, 확률은 design/cookies/catalog.json의 gacha.odds)
// 같은 쿠키가 또 나오면 등급별 부스러기로 바뀐다.

import { randomInt } from 'node:crypto';
import { sessionLogin } from '../src/session.js';
import { todayIn } from '../src/pick.js';
import { COOKIES, GACHA } from '../src/cookie-catalog.js';
import { loadAccount } from '../src/account.js';
import { drawCookies, exchangeCrumbs } from '../src/store.js';
import { sendJson, readJson, isSameOrigin } from '../src/http.js';

const POOL = COOKIES.filter((cookie) => cookie.category === '뽑기');

// 확률대로 등급을 고르고, 그 등급 안에서 같은 확률로 쿠키 하나 (rand: 테스트용 난수 함수)
export function rollCookie(rand = (n) => randomInt(n)) {
  let roll = rand(10000);
  let rarity = '일반';
  for (const [name, odds] of Object.entries(GACHA.odds)) {
    const share = Math.round(odds * 10000);
    if (roll < share) { rarity = name; break; }
    roll -= share;
  }
  const candidates = POOL.filter((cookie) => cookie.rarity === rarity);
  const cookie = candidates[rand(candidates.length)];
  return { id: cookie.id, rarity };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 200, { pool: POOL.map(({ id, label, rarity }) => ({ id, label, rarity })), ...GACHA });
    return;
  }
  const login = sessionLogin(req);
  if (!login) {
    sendJson(res, 401, { error: '로그인하면 쿠키를 뽑을 수 있어요.' });
    return;
  }
  if (!isSameOrigin(req)) {
    sendJson(res, 403, { error: '다른 사이트에서 온 요청은 받을 수 없어요.' });
    return;
  }
  const body = await readJson(req);
  const date = todayIn();
  const account = await loadAccount(login, date);
  if (!account.wallet) {
    sendJson(res, 503, { error: '포인트를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
    return;
  }

  if (body.action === 'draw') {
    const count = body.count === 10 ? 10 : 1;
    const price = count === 10 ? GACHA.ten_pack_price : GACHA.ticket_price;
    const picks = Array.from({ length: count }, () => rollCookie());
    const { status, results, usedTicket } = await drawCookies(login, {
      year: date.slice(0, 4), price, earned: account.wallet.earned, picks, crumbTable: GACHA.crumbs_on_duplicate,
      useTicket: count === 1 && account.wallet.tickets > 0,
    });
    if (status === 'poor') {
      sendJson(res, 403, { error: `포인트가 모자라요. (${price - account.wallet.balance}점 더 필요해요)` });
      return;
    }
    if (status !== 'ok') {
      sendJson(res, 503, { error: '뽑지 못했어요. 잠시 후 다시 시도해 주세요. (포인트는 그대로예요)' });
      return;
    }
    const after = await loadAccount(login, date);
    sendJson(res, 200, { ok: true, results, usedTicket, wallet: after.wallet });
    return;
  }

  if (body.action === 'exchange') {
    const cookie = POOL.find((c) => c.id === body.cookie);
    if (!cookie) {
      sendJson(res, 400, { error: '뽑기 쿠키만 바꿀 수 있어요.' });
      return;
    }
    const cost = GACHA.exchange_cost[cookie.rarity];
    const result = await exchangeCrumbs(login, { cookieId: cookie.id, cost });
    const errors = { owned: [409, '이미 가지고 있는 쿠키예요.'], poor: [403, `부스러기가 모자라요. (${cost}개 필요해요)`] };
    if (errors[result]) {
      sendJson(res, errors[result][0], { error: errors[result][1] });
      return;
    }
    if (result !== 'ok') {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    const after = await loadAccount(login, date);
    sendJson(res, 200, { ok: true, cookie: cookie.id, wallet: after.wallet });
    return;
  }

  sendJson(res, 400, { error: '알 수 없는 요청이에요.' });
}
