// DB(Redis) 읽기/쓰기 모듈 (v2.1, v2.2)
// 저장하는 것 (GitHub 아이디 기준, 그 외 개인정보는 저장하지 않는다)
//   equip:아이디          장착한 스킨 이름
//   theme:아이디          장착한 테마 이름 (v2.2)
//   owned:아이디          상점에서 산 물건 집합, 예: skin:cat, theme:strawberry (v2.2, 영원히)
//   earned:아이디         업적으로 한 번이라도 해금한 스킨 집합, 예: cat (v2.2, 영원히)
//   spent:아이디:연도     그해에 쓴 포인트 (v2.2)
//   attend:아이디:연도    그해에 출석 보상을 받은 날짜 집합 (v2.2)
// Redis 주소는 Vercel에 연결한 DB가 넣어 주는 환경변수 REDIS_URL을 쓴다.
// DB에 문제가 있어도 위젯이 깨지지 않도록, 읽기에 실패하면 null을 돌려준다.

import { createClient } from 'redis';

let clientPromise = null;

// Redis 연결을 하나 만들어 두고 다시 쓴다. (서버리스 함수가 살아 있는 동안 재사용)
async function getClient() {
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
async function write(login, run) {
  try {
    const client = await getClient();
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
    const [spent, attendance, attendedToday] = await client.multi()
      .get(keys.spent(login, year))
      .sCard(keys.attend(login, year))
      .sIsMember(keys.attend(login, year), date)
      .exec();
    return { spent: Number(spent) || 0, attendance: Number(attendance) || 0, attendedToday: Boolean(attendedToday) };
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
