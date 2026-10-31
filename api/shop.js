// /api/shop: 쿠키 상점 (v2.2, v3에서 아이템·보너스 추가)
//   GET  : 상품 목록 + (로그인했으면) 지갑·가진 것·장착한 것
//   POST : { action: 'attend' } 출석 보상, { action: 'buy', item: 'skin:cat' | 'theme:vanilla' | 'item:freeze' ... } 구매
// 포인트 계산과 보상 지급은 src/account.js가 한다. 결과를 믿을 수 있도록 가격·잔액은 모두 서버에서 계산한다.

import { sessionLogin } from '../src/session.js';
import { addAttendance, buyItem, buyFreeze, buyTicket } from '../src/store.js';
import { fetchActivity } from '../src/github.js';
import { todayIn } from '../src/pick.js';
import { catalog, findItem, POINTS_PER_ATTENDANCE } from '../src/shop.js';
import { ITEMS } from '../src/cookie-catalog.js';
import { loadAccount } from '../src/account.js';
import { buyAiFortune } from '../src/ai-fortune.js';
import { sendJson, readJson, isSameOrigin } from '../src/http.js';

// 화면에 보내는 지갑·가진 것
function summary(account) {
  return {
    wallet: account.wallet,
    unlocked: account.cookies.filter((c) => c.unlocked && !c.bought).map((c) => c.id),
    owned: account.profile?.owned ?? [],
    equipped: account.profile?.skin ?? null,
    theme: account.profile?.theme ?? null,
    todayOpen: account.activity ? account.activity.today > 0 : null, // 오늘 쿠키가 열렸는지 (출석 가능 여부)
    streak: account.daily.streak,
    rewards: account.rewards,
    daily: account.daily, // 오른쪽 패널(퀘스트)용: /api/daily를 따로 부르지 않게 (v3, 속도)
    next: account.next,
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
    sendJson(res, 200, { items, loggedIn: true, login, ...summary(await loadAccount(login, date)) });
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
  const year = date.slice(0, 4);

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
    const result = await addAttendance(login, { year, date });
    if (!result) {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    const account = await loadAccount(login, date);
    sendJson(res, 200, { ok: true, added: result === 'added' ? POINTS_PER_ATTENDANCE : 0, ...summary(account) });
    return;
  }

  if (body.action === 'buy') {
    const item = findItem(body.item);
    if (!item) {
      sendJson(res, 400, { error: '없는 상품이에요.' });
      return;
    }
    const before = await loadAccount(login, date);
    if (!before.wallet) {
      sendJson(res, 503, { error: '포인트를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    if (item.kind === 'skin' && before.cookies.find((c) => c.id === item.name)?.unlocked) {
      sendJson(res, 409, { error: '이미 해금한 쿠키예요. 도감에서 바로 장착할 수 있어요.' });
      return;
    }
    const money = { year, date, price: item.price, earned: before.wallet.earned };
    let result;
    let extra = {};
    if (item.id === 'item:freeze') result = await buyFreeze(login, { ...money, max: ITEMS.freeze.max });
    else if (item.id === 'item:gacha_ticket') result = await buyTicket(login, money);
    else if (item.id === 'item:ai_fortune') ({ result, ...extra } = await buyAiFortune(login, { ...money, account: before }));
    else result = await buyItem(login, { year, itemId: item.id, price: item.price, earned: before.wallet.earned });

    const errors = {
      owned: [409, '이미 가지고 있어요.'],
      full: [409, `냉동 쿠키는 ${ITEMS.freeze.max}개까지 가질 수 있어요.`],
      poor: [403, `포인트가 모자라요. (${item.price - before.wallet.balance}점 더 필요해요)`],
      done: [409, '오늘은 이미 AI 점쟁이가 운세를 써 줬어요.'],
      busy: [503, '오늘은 AI 점쟁이가 너무 바빠요. 내일 다시 와 주세요. (포인트는 쓰지 않았어요)'],
      failed: [503, 'AI 점쟁이가 운세를 쓰지 못했어요. 포인트는 돌려드렸어요.'],
      off: [503, 'AI 점쟁이가 아직 준비 중이에요.'],
    };
    if (errors[result]) {
      sendJson(res, errors[result][0], { error: errors[result][1] });
      return;
    }
    if (result !== 'ok') {
      sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    sendJson(res, 200, { ok: true, item, ...extra, ...summary(await loadAccount(login, date)) });
    return;
  }

  sendJson(res, 400, { error: '알 수 없는 요청이에요.' });
}
