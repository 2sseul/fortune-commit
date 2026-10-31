// /api/me: 로그인한 사람의 도감 정보와 장착 (v2.1, v2.2)
//   GET  → { loggedIn, login, equipped, theme, ownedThemes, skins: [{ id, unlocked, bought, current, goal, unit }] }
//   GET ?brief=1 → { loggedIn, login, equipped } (헤더용, GitHub 활동은 확인하지 않아 빠르다)
//   POST { skin: '이름' }  → 스킨 장착. 업적으로 해금했거나 상점에서 산 스킨만 장착할 수 있다.
//   POST { theme: '이름' } → 테마 장착 (상점에서 산 테마만). { theme: null }이면 해제 (v2.2)
// 다른 사람의 설정은 바꿀 수 없다: 장착은 항상 서명된 로그인 쿠키의 아이디에만 저장한다.

import { sessionLogin } from '../src/session.js';
import { getProfile, setEquippedSkin, setEquippedTheme } from '../src/store.js';
import { todayIn } from '../src/pick.js';
import { COOKIES } from '../src/cookie-catalog.js';
import { shopThemes } from '../src/themes.js';
import { hasSkin } from '../src/unlocks.js';
import { loadAccount } from '../src/account.js';
import { sendJson, readJson, isSameOrigin } from '../src/http.js';

export default async function handler(req, res) {
  const login = sessionLogin(req);
  if (!login) {
    sendJson(res, req.method === 'GET' ? 200 : 401, { loggedIn: false });
    return;
  }

  const profile = (await getProfile(login)) ?? { skin: null, theme: null, owned: [], earned: [] };
  const owned = new Set(profile.owned);

  // 헤더처럼 로그인 여부만 필요할 때는 GitHub 활동을 확인하지 않고 바로 돌려준다.
  if (req.method === 'GET' && new URL(req.url, 'http://localhost').searchParams.get('brief')) {
    sendJson(res, 200, { loggedIn: true, login, equipped: profile.skin });
    return;
  }

  if (req.method === 'POST') {
    if (!isSameOrigin(req)) {
      sendJson(res, 403, { error: '다른 사이트에서 온 요청은 받을 수 없어요.' });
      return;
    }
    const body = await readJson(req);
    if ('theme' in body) await equipTheme(res, login, owned, body.theme);
    else await equipSkin(res, login, profile, body.skin);
    return;
  }

  // GET: 도감 정보 — 쿠키 65종의 해금 상태와 진행 상황 (v3: src/account.js가 사이트 기록까지 함께 계산)
  // 올해 새로 해금한 쿠키는 그 안에서 영원히 기록한다. (해가 바뀌어도 계속 내 것)
  const account = await loadAccount(login, todayIn());
  const ownedThemes = [...owned].filter((item) => item.startsWith('theme:')).map((item) => item.slice(6));
  sendJson(res, 200, {
    loggedIn: true, login, equipped: profile.skin, theme: profile.theme, ownedThemes, activityChecked: Boolean(account.year),
    skins: account.cookies, next: account.next, wallet: account.wallet, streak: account.daily.streak,
    languageCommits: account.year?.languageCommits ?? {}, // 올해 언어별 커밋 수 (언어 쿠키, 도감에 표시)
    daily: account.daily, // 오른쪽 패널(퀘스트)용: /api/daily를 따로 부르지 않게 (v3, 속도)
  });
}

async function equipSkin(res, login, profile, skin) {
  if (!COOKIES.some((cookie) => cookie.id === skin)) {
    sendJson(res, 400, { error: '없는 스킨이에요.' });
    return;
  }
  // 해금 확인: 기본 쿠키, 산 스킨, 예전에 해금한 스킨은 언제나 가능. 나머지는 올해 활동을 확인할 수 있어야 한다.
  if (!hasSkin(skin, { year: null, profile })) {
    const account = await loadAccount(login, todayIn());
    if (!account.year) {
      sendJson(res, 503, { error: 'GitHub 활동을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      return;
    }
    if (!account.cookies.find((cookie) => cookie.id === skin)?.unlocked) {
      sendJson(res, 403, { error: '아직 해금하지 않은 스킨이에요.' });
      return;
    }
  }
  if (!(await setEquippedSkin(login, skin))) {
    sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
    return;
  }
  sendJson(res, 200, { ok: true, equipped: skin });
}

async function equipTheme(res, login, owned, theme) {
  if (theme !== null) {
    if (!Object.hasOwn(shopThemes, theme ?? '')) {
      sendJson(res, 400, { error: '없는 테마예요.' });
      return;
    }
    if (!owned.has(`theme:${theme}`)) {
      sendJson(res, 403, { error: '아직 사지 않은 테마예요.' });
      return;
    }
  }
  if (!(await setEquippedTheme(login, theme))) {
    sendJson(res, 503, { error: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.' });
    return;
  }
  sendJson(res, 200, { ok: true, theme });
}
