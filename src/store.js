// DB(Redis) 읽기/쓰기 모듈 (v2.1)
// 저장하는 것: GitHub 아이디 → 장착한 스킨 이름 (키: equip:아이디). 그 외 개인정보는 저장하지 않는다.
// Redis 주소는 Vercel에 연결한 DB가 넣어 주는 환경변수 REDIS_URL을 쓴다.
// DB에 문제가 있어도 위젯이 깨지지 않도록, 실패하면 null을 돌려준다.

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

// 위젯이 자주 읽으므로, 서버 안에서 1분 동안 기억해 Redis 호출을 줄인다.
const memory = new Map();
const MEMORY_MS = 60 * 1000;

const key = (login) => `equip:${login.toLowerCase()}`;

// 장착한 스킨 이름을 돌려준다. 없거나 확인할 수 없으면 null.
export async function getEquippedSkin(login, { now = Date.now() } = {}) {
  if (!login) return null;
  const remembered = memory.get(login);
  if (remembered && remembered.expiresAt > now) return remembered.skin;
  try {
    const client = await getClient();
    if (!client) return null;
    const skin = await client.get(key(login));
    memory.set(login, { skin, expiresAt: now + MEMORY_MS });
    return skin;
  } catch {
    return null;
  }
}

// 장착한 스킨을 저장한다. 성공하면 true.
export async function setEquippedSkin(login, skin) {
  try {
    const client = await getClient();
    if (!client) return false;
    await client.set(key(login), skin);
    memory.set(login, { skin, expiresAt: Date.now() + MEMORY_MS });
    return true;
  } catch {
    return false;
  }
}
