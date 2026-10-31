// 개발용 메모리 DB (v3)
// 로컬에는 Redis가 없어서, `npm run dev`(FC_DEV=1)일 때만 Redis 대신 쓴다. 서버를 끄면 내용이 사라진다.
// 이 프로젝트가 쓰는 Redis 명령만 흉내 낸다. 테스트의 가짜 DB로도 쓴다.

export function createMemoryDb() {
  const data = new Map();
  const setOf = (key) => data.get(key) ?? data.set(key, new Set()).get(key);
  const hashOf = (key) => data.get(key) ?? data.set(key, new Map()).get(key);
  const listOf = (key) => data.get(key) ?? data.set(key, []).get(key);
  const many = (value) => (Array.isArray(value) ? value : [value]);

  const db = {
    data,
    async get(key) { const v = data.get(key); return v === undefined ? null : String(v); },
    async set(key, value, options = {}) {
      if (options.NX && data.has(key)) return null;
      data.set(key, value);
      return 'OK';
    },
    async del(key) { return data.delete(key) ? 1 : 0; },
    async incrBy(key, n) { const v = Number(data.get(key) ?? 0) + n; data.set(key, v); return v; },
    async decrBy(key, n) { const v = Number(data.get(key) ?? 0) - n; data.set(key, v); return v; },
    async sAdd(key, value) { const s = setOf(key); let added = 0; for (const v of many(value)) if (!s.has(v)) { s.add(v); added += 1; } return added; },
    async sRem(key, value) { const s = setOf(key); let removed = 0; for (const v of many(value)) if (s.delete(v)) removed += 1; return removed; },
    async sIsMember(key, value) { return setOf(key).has(value); },
    async sMembers(key) { return [...setOf(key)]; },
    async sCard(key) { return setOf(key).size; },
    async hSet(key, field, value) { const h = hashOf(key); const had = h.has(field); h.set(field, value); return had ? 0 : 1; },
    async hGet(key, field) { return hashOf(key).get(field) ?? null; },
    async hGetAll(key) { return Object.fromEntries(hashOf(key)); },
    async lPush(key, value) { const l = listOf(key); l.unshift(...many(value)); return l.length; },
    async lRange(key, start, stop) { const l = listOf(key); return l.slice(start, stop === -1 ? undefined : stop + 1); },
    async lRem(key, count, value) { const l = listOf(key); const i = l.lastIndexOf(value); if (i < 0) return 0; l.splice(i, 1); return 1; },
    async lLen(key) { return listOf(key).length; },
    async expire() { return 1; },
    // multi(): 명령을 모았다가 exec()에서 차례로 실행한다.
    multi() {
      const queue = [];
      const chain = new Proxy({}, {
        get(_, name) {
          if (name === 'exec') return async () => { const out = []; for (const [fn, args] of queue) out.push(await db[fn](...args)); return out; };
          return (...args) => { queue.push([name, args]); return chain; };
        },
      });
      return chain;
    },
  };
  return db;
}
