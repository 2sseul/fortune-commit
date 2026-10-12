// /api/shop: 쿠키 상점 (v2.2)
//   GET  → { items: [{ id, kind, name, price }], loggedIn, login?, wallet?, owned?, unlocked?, equipped?, theme?, todayOpen? }
//          wallet: { fromContributions, fromAttendance, earned, spent, balance, attendance, attendedToday }
//          unlocked: 올해 업적으로 이미 해금한 스킨 (상점에 보여주지 않고, 살 수도 없다)
//   POST { action: 'attend' } → 오늘 쿠키가 열렸으면(오늘 활동 1개 이상) 출석 +30, 하루 한 번
//   POST { action: 'buy', item: 'skin:cat' } → 포인트로 산다
// 포인트 = 올해 기여 × 10 + 올해 출석 × 30 − 올해 쓴 포인트 (src/shop.js)
// 모든 확인은 서버에서 한다: 서명된 로그인 쿠키의 아이디, 같은 사이트에서 온 요청, 포인트 부족, 이미 산 물건

import { sessionLogin } from '../src/session.js';
import { getProfile, getWalletRecord, addAttendance, buyItem } from '../src/store.js';
import { fetchActivity, fetchYearActivity } from '../src/github.js';
import { todayIn } from '../src/pick.js';
import { catalog, findItem, wallet, POINTS_PER_ATTENDANCE, SKIN_PRICES } from '../src/shop.js';
import { skinStatus } from '../src/unlocks.js';
import { sendJson, readJson, isSameOrigin } from '../src/http.js';

// 올해 활동과 지갑 기록으로 지갑을 계산한다. 확인할 수 없으면 null.
//   unlocked: 파는 스킨 중 올해 업적으로 이미 해금한 것
async function loadWallet(login, date) {
  const [year, record] = await Promise.all([
    fetchYearActivity({ login, date }),
    getWalletRecord(login, { year: date.slice(0, 4), date }),
  ]);
  if (!year || !record) return null;
  return {
    ...wallet({ contributions: year.total, attendance: record.attendance, spent: record.spent }),
    attendance: record.attendance,
    attendedToday: record.attendedToday,
    unlocked: Object.keys(SKIN_PRICES).filter((id) => skinStatus(id, year).unlocked),
  };
}

export default async function handler(req, res) {
  const login = sessionLogin(req);
  const date = todayIn();

  if (req.method === 'GET') {
    const items = catalog();
    if (!login) {
      sendJson(res, 200, { items, loggedIn: false });
      return;
    }
    const [walletInfo, profile, activity] = await Promise.all([
      loadWallet(login, date),
      getProfile(login),
      fetchActivity({ login, date }),
    ]);
    const { unlocked = [], ...walletRest } = walletInfo ?? {};
    sendJson(res, 200, {
      items,
      loggedIn: true,
      login,
      wallet: walletInfo ? walletRest : null,
      unlocked,
      owned: profile?.owned ?? [],
      equipped: profile?.skin ?? null,
      theme: profile?.theme ?? null,
      todayOpen: activity ? activity.today > 0 : null, // 오늘 쿠키가 열렸는지 (출석 가능 여부)
    });
    return;
  }

  if (!login) {
    sendJson(res, 401, { error: '로그인이 필요해요.' });
    return;
  }
  if (!isSameOrigin(req)) {
    sendJson(res, 403, { error: '다른 사이트에서 온 요청은 받을 수 없어요.' });
    return;
  }
  const body = await readJson(req);

  // ---------- 출석 ----------
  if (body.action === 'attend') {
    const activity = await fetchActivity({ login, date });
    if (!activity) {
      sendJson(res, 503, { error: 'GitHub 활동을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    if (activity.today === 0) {
      sendJson(res, 403, { error: '오늘 커밋을 하면 출석 포인트를 받을 수 있어요.' });
      return;
    }
    const result = await addAttendance(login, { year: date.slice(0, 4), date });
    if (!result) {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    sendJson(res, 200, { ok: true, added: result === 'added' ? POINTS_PER_ATTENDANCE : 0, wallet: await loadWallet(login, date) });
    return;
  }

  // ---------- 구매 ----------
  if (body.action === 'buy') {
    const item = findItem(body.item);
    if (!item) {
      sendJson(res, 400, { error: '없는 상품이에요.' });
      return;
    }
    const before = await loadWallet(login, date);
    if (!before) {
      sendJson(res, 503, { error: '포인트를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    if (item.kind === 'skin' && before.unlocked.includes(item.name)) {
      sendJson(res, 409, { error: '올해 업적으로 이미 해금한 쿠키예요. 도감에서 바로 장착할 수 있어요.' });
      return;
    }
    const result = await buyItem(login, { year: date.slice(0, 4), itemId: item.id, price: item.price, earned: before.earned });
    if (result === 'owned') {
      sendJson(res, 409, { error: '이미 가지고 있어요.' });
      return;
    }
    if (result === 'poor') {
      sendJson(res, 403, { error: `포인트가 모자라요. (${item.price - before.balance}점 더 필요해요)` });
      return;
    }
    if (!result) {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    sendJson(res, 200, { ok: true, item, wallet: await loadWallet(login, date) });
    return;
  }

  sendJson(res, 400, { error: '알 수 없는 요청이에요.' });
}
