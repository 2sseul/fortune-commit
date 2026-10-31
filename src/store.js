// DB(Redis) 읽기/쓰기 모듈 (v2.1, v2.2)
// 저장하는 것 (GitHub 아이디 기준, 그 외 개인정보는 저장하지 않는다)
//   equip:아이디          장착한 스킨 이름
//   theme:아이디          장착한 테마 이름 (v2.2)
//   owned:아이디          상점에서 산 물건 집합, 예: skin:cat, theme:strawberry (v2.2, 영원히)
//   earned:아이디         업적으로 한 번이라도 해금한 스킨 집합, 예: cat (v2.2, 영원히)
//   spent:아이디:연도     그해에 쓴 포인트 (v2.2)
//   attend:아이디:연도    그해에 출석 보상을 받은 날짜 집합 (v2.2)
//   (v3) bonus:아이디:연도   그해에 받은 보너스 포인트 (연속 보너스, 퀘스트)
//        claimed:아이디:연도 받은 보상 목록: 'streak:7', 'quest:2026-11-01:commit' 같은 꼴 (두 번 받지 않게)
//        freeze:아이디       갖고 있는 냉동 쿠키 (산 날짜 목록, 최대 2개)
//        frozen:아이디       냉동 쿠키로 이은 날짜 집합
//        crumbs:아이디       쿠키 부스러기 수, tickets:아이디: 쿠키 뽑기권 수
//        diary:아이디:연도   운세 일기: 날짜 → { fortune, grade } (쿠키를 연 날)
//        since:아이디        위젯·사이트에서 처음 본 날 (레트로 쿠키)
//        ai:아이디:날짜      AI 점쟁이가 쓴 그날의 운세, ai-count:날짜: 그날 전체 생성 수
// Redis 주소는 Vercel에 연결한 DB가 넣어 주는 환경변수 REDIS_URL을 쓴다.
// DB에 문제가 있어도 위젯이 깨지지 않도록, 읽기에 실패하면 null을 돌려준다.

import { createClient } from 'redis';

let clientPromise = null;

// Redis 연결을 하나 만들어 두고 다시 쓴다. (서버리스 함수가 살아 있는 동안 재사용)
let devDb = null;
async function getClient() {
  // 로컬 개발 서버(FC_DEV=1)에서 Redis가 없으면 메모리 DB를 쓴다.
  if (!process.env.REDIS_URL && process.env.FC_DEV === '1') {
    devDb ??= (await import('./memory-db.js')).createMemoryDb();
    return devDb;
  }
  if (!process.env.REDIS_URL) return null;
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 3000 } });
    client.on('error', () => {}); // 연결 오류로 서버가 죽지 않게 한다. (요청마다 실패로 처리)
    clientPromise = client.connect().then(() => client).catch(() => {
      clientPromise = null; // 다음 요청에서 다시 연결해 본다.
      return null;
    });
  }
  return clientPromise;
}

const id = (login) => login.toLowerCase();
const keys = {
  equip: (login) => `equip:${id(login)}`,
  theme: (login) => `theme:${id(login)}`,
  owned: (login) => `owned:${id(login)}`,
  earned: (login) => `earned:${id(login)}`,
  spent: (login, year) => `spent:${id(login)}:${year}`,
  attend: (login, year) => `attend:${id(login)}:${year}`,
  bonus: (login, year) => `bonus:${id(login)}:${year}`,
  claimed: (login, year) => `claimed:${id(login)}:${year}`,
  freeze: (login) => `freeze:${id(login)}`,
  frozen: (login) => `frozen:${id(login)}`,
  crumbs: (login) => `crumbs:${id(login)}`,
  tickets: (login) => `tickets:${id(login)}`,
  diary: (login, year) => `diary:${id(login)}:${year}`,
  since: (login) => `since:${id(login)}`,
  ai: (login, date) => `ai:${id(login)}:${date}`,
  aiCount: (date) => `ai-count:${date}`,
};

// 위젯이 자주 읽으므로, 서버 안에서 1분 동안 기억해 Redis 호출을 줄인다.
const memory = new Map();
const MEMORY_MS = 60 * 1000;

// 장착한 스킨·테마, 산 물건, 업적으로 해금했던 스킨을 한 번에 읽는다.
//   { skin: 이름|null, theme: 이름|null, owned: ['skin:cat', ...], earned: ['cat', ...] }. 확인할 수 없으면 null.
export async function getProfile(login, { now = Date.now() } = {}) {
  if (!login) return null;
  const remembered = memory.get(id(login));
  if (remembered && remembered.expiresAt > now) return remembered.profile;
  try {
    const client = await getClient();
    if (!client) return null;
    const [skin, theme, owned, earned] = await client.multi()
      .get(keys.equip(login))
      .get(keys.theme(login))
      .sMembers(keys.owned(login))
      .sMembers(keys.earned(login))
      .exec();
    const profile = { skin, theme, owned, earned };
    memory.set(id(login), { profile, expiresAt: now + MEMORY_MS });
    return profile;
  } catch {
    return null;
  }
}

// v2.1부터 쓰던 함수: 장착한 스킨 이름만 돌려준다.
export async function getEquippedSkin(login) {
  return (await getProfile(login))?.skin ?? null;
}

// 장착한 스킨을 저장한다. 성공하면 true.
export async function setEquippedSkin(login, skin) {
  return write(login, (client) => client.set(keys.equip(login), skin));
}

// 장착한 테마를 저장한다. null이면 장착을 해제한다. 성공하면 true.
export async function setEquippedTheme(login, theme) {
  return write(login, (client) => (theme ? client.set(keys.theme(login), theme) : client.del(keys.theme(login))));
}

// 업적으로 해금한 스킨을 영원히 기록한다. (이미 기록된 것은 빼고 부른다)
export async function addEarnedSkins(login, skins) {
  if (!login || !skins.length) return true;
  return write(login, (client) => client.sAdd(keys.earned(login), skins));
}

// 쓰기를 하고, 기억해 둔 프로필을 지워 다음 읽기에서 새 값을 보게 한다.
async function write(login, run, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return false;
    await run(client);
    memory.delete(id(login));
    return true;
  } catch {
    return false;
  }
}

// 올해 지갑 정보: { spent, attendance: 출석한 날 수, attendedToday }. 확인할 수 없으면 null.
export async function getWalletRecord(login, { year, date }) {
  try {
    const client = await getClient();
    if (!client) return null;
    const [spent, attendance, attendedToday, bonus, crumbs, tickets, freezes] = await client.multi()
      .get(keys.spent(login, year))
      .sCard(keys.attend(login, year))
      .sIsMember(keys.attend(login, year), date)
      .get(keys.bonus(login, year))
      .get(keys.crumbs(login))
      .get(keys.tickets(login))
      .lLen(keys.freeze(login))
      .exec();
    return {
      spent: Number(spent) || 0, attendance: Number(attendance) || 0, attendedToday: Boolean(attendedToday),
      bonus: Number(bonus) || 0, crumbs: Number(crumbs) || 0, tickets: Number(tickets) || 0, freezes: Number(freezes) || 0,
    };
  } catch {
    return null;
  }
}

// 오늘 출석을 기록한다. 새로 기록했으면 'added', 이미 했으면 'already', 실패하면 null.
// (db: 테스트에서 가짜 DB를 넣을 때만 쓴다)
export async function addAttendance(login, { year, date }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    const added = await client.sAdd(keys.attend(login, year), date);
    return added ? 'added' : 'already';
  } catch {
    return null;
  }
}

// 물건을 산다. 포인트가 모자라면 사지 않는다.
//   earned: 올해 번 포인트(기여 + 출석), price: 가격
//   돌려주는 값: 'ok' | 'owned'(이미 있음) | 'poor'(포인트 부족) | null(DB 실패)
// 쓴 포인트를 먼저 올려 보고, 넘치면 되돌린다. (동시에 두 번 눌러도 포인트가 음수가 되지 않게)
export async function buyItem(login, { year, itemId, price, earned }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    if (await client.sIsMember(keys.owned(login), itemId)) return 'owned';
    const spent = await client.incrBy(keys.spent(login, year), price);
    if (spent > earned) {
      await client.decrBy(keys.spent(login, year), price);
      return 'poor';
    }
    const added = await client.sAdd(keys.owned(login), itemId);
    if (!added) { // 그사이 다른 요청이 먼저 샀다면 포인트를 돌려준다.
      await client.decrBy(keys.spent(login, year), price);
      return 'owned';
    }
    memory.delete(id(login));
    return 'ok';
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// v3: 포인트 쓰기, 보너스, 냉동 쿠키, 뽑기, 일기, AI 점쟁이

// 포인트를 쓴다. earned(그해에 번 포인트)를 넘으면 되돌린다. → 'ok' | 'poor' | null(실패)
export async function spendPoints(login, { year, price, earned }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    const spent = await client.incrBy(keys.spent(login, year), price);
    if (spent > earned) {
      await client.decrBy(keys.spent(login, year), price);
      return 'poor';
    }
    return 'ok';
  } catch {
    return null;
  }
}

// 쓴 포인트를 돌려준다. (AI 점쟁이가 실패했을 때)
export async function refundPoints(login, { year, price }, db) {
  return write(login, (client) => client.decrBy(keys.spent(login, year), price), db);
}

// 보상을 한 번만 준다. (같은 열쇠로 두 번 부르면 두 번째는 false)
//   rewardKey: 'streak:7', 'quest:2026-11-01:commit' 같은 꼴
export async function grantOnce(login, { year, rewardKey, points }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return false;
    if (!(await client.sAdd(keys.claimed(login, year), rewardKey))) return false;
    if (points) await client.incrBy(keys.bonus(login, year), points);
    return true;
  } catch {
    return false;
  }
}

export async function getClaimed(login, year, db) {
  try {
    const client = db ?? await getClient();
    return client ? await client.sMembers(keys.claimed(login, year)) : [];
  } catch {
    return [];
  }
}

// 냉동 쿠키: 산 날짜 목록과 이미 이은 날짜
export async function getFreezes(login, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return { freezes: [], frozen: new Set() };
    const [freezes, frozen] = await client.multi().lRange(keys.freeze(login), 0, -1).sMembers(keys.frozen(login)).exec();
    return { freezes, frozen: new Set(frozen) };
  } catch {
    return { freezes: [], frozen: new Set() };
  }
}

// 냉동 쿠키를 산다. 최대 개수를 넘으면 'full'. → 'ok' | 'full' | 'poor' | null
export async function buyFreeze(login, { year, date, price, earned, max }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    if ((await client.lLen(keys.freeze(login))) >= max) return 'full';
    const paid = await spendPoints(login, { year, price, earned }, client);
    if (paid !== 'ok') return paid;
    const count = await client.lPush(keys.freeze(login), date);
    if (count > max) { // 그사이 다른 요청이 먼저 샀다면 되돌린다.
      await client.lRem(keys.freeze(login), 1, date);
      await client.decrBy(keys.spent(login, year), price);
      return 'full';
    }
    return 'ok';
  } catch {
    return null;
  }
}

// 냉동 쿠키를 쓴다: [[이을 날짜, 쓸 냉동 쿠키의 산 날짜], ...]
export async function useFreezes(login, uses, db) {
  if (!uses.length) return true;
  return write(login, async (client) => {
    for (const [date, bought] of uses) {
      if (await client.lRem(keys.freeze(login), 1, bought)) await client.sAdd(keys.frozen(login), date);
    }
  }, db);
}

// 뽑기권을 산다 (포인트 → 뽑기권 1장)
export async function buyTicket(login, { year, price, earned }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    const paid = await spendPoints(login, { year, price, earned }, client);
    if (paid === 'ok') await client.incrBy(keys.tickets(login), 1);
    return paid;
  } catch {
    return null;
  }
}

// 뽑기: 뽑기권이 있으면 먼저 쓰고, 없으면 포인트를 쓴다. 이미 가진 쿠키는 부스러기로 바꾼다.
//   picks: [{ id, rarity }] (어떤 쿠키가 나올지는 api/gacha.js가 정한다)
//   crumbTable: 등급 → 부스러기 수
// → { status: 'ok' | 'poor' | null, results: [{ id, rarity, duplicate, crumbs }], usedTicket }
export async function drawCookies(login, { year, price, earned, picks, crumbTable, useTicket }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return { status: null };
    let usedTicket = false;
    if (useTicket) {
      const left = await client.decrBy(keys.tickets(login), 1);
      if (left >= 0) usedTicket = true;
      else await client.incrBy(keys.tickets(login), 1);
    }
    if (!usedTicket) {
      const paid = await spendPoints(login, { year, price, earned }, client);
      if (paid !== 'ok') return { status: paid };
    }
    const results = [];
    for (const pick of picks) {
      const isNew = await client.sAdd(keys.earned(login), pick.id);
      const crumbs = isNew ? 0 : crumbTable[pick.rarity] ?? 1;
      if (crumbs) await client.incrBy(keys.crumbs(login), crumbs);
      results.push({ ...pick, duplicate: !isNew, crumbs });
    }
    memory.delete(id(login));
    return { status: 'ok', results, usedTicket };
  } catch {
    return { status: null };
  }
}

// 부스러기로 원하는 뽑기 쿠키 하나 받기 → 'ok' | 'owned' | 'poor' | null
export async function exchangeCrumbs(login, { cookieId, cost }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    if (await client.sIsMember(keys.earned(login), cookieId)) return 'owned';
    const left = await client.decrBy(keys.crumbs(login), cost);
    if (left < 0) {
      await client.incrBy(keys.crumbs(login), cost);
      return 'poor';
    }
    if (!(await client.sAdd(keys.earned(login), cookieId))) { // 그사이 먼저 받았다면 되돌린다.
      await client.incrBy(keys.crumbs(login), cost);
      return 'owned';
    }
    memory.delete(id(login));
    return 'ok';
  } catch {
    return null;
  }
}

// 운세 일기: 쿠키를 연 날의 운세를 남긴다. (그날 처음 연 운세만)
export async function saveDiary(login, { date, entry }, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return false;
    const key = keys.diary(login, date.slice(0, 4));
    if (await client.hGet(key, date)) return true;
    await client.hSet(key, date, JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

export async function getDiary(login, year, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    const raw = await client.hGetAll(keys.diary(login, year));
    return Object.fromEntries(Object.entries(raw ?? {}).map(([date, json]) => [date, JSON.parse(json)]));
  } catch {
    return null;
  }
}

// 위젯·사이트에서 처음 본 날 (이미 있으면 그대로) → 그 날짜
export async function markSince(login, date, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return null;
    await client.set(keys.since(login), date, { NX: true });
    return await client.get(keys.since(login));
  } catch {
    return null;
  }
}

// AI 점쟁이 운세
export async function getAiFortune(login, date, db) {
  try {
    const client = db ?? await getClient();
    return client ? await client.get(keys.ai(login, date)) : null;
  } catch {
    return null;
  }
}

export async function saveAiFortune(login, date, text, db) {
  return write(login, (client) => client.set(keys.ai(login, date), text), db);
}

// 그날 전체 AI 생성 수를 하나 늘리고, 상한을 넘었으면 false
export async function takeAiSlot(date, limit, db) {
  try {
    const client = db ?? await getClient();
    if (!client) return false;
    const count = await client.incrBy(keys.aiCount(date), 1);
    if (count === 1) await client.expire(keys.aiCount(date), 2 * 24 * 3600);
    if (count > limit) {
      await client.decrBy(keys.aiCount(date), 1);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function releaseAiSlot(date, db) {
  try {
    const client = db ?? await getClient();
    if (client) await client.decrBy(keys.aiCount(date), 1);
  } catch {
    // 다음 날이면 어차피 새로 센다.
  }
}
