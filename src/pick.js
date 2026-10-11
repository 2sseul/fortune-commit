// "오늘의 운세"를 고르는 모듈
// 핵심 약속: 같은 아이디 + 같은 날짜 + 같은 언어라면 언제 열어도 같은 운세가 나온다.
// 그래서 Math.random() 같은 난수 대신, 입력값으로 항상 같은 숫자를 만드는 "해시"를 쓴다.

import { fortunes } from './fortunes.js';
import { luckyCategories, LUCKY_PER_DAY } from './lucky.js';

export const DEFAULT_TIME_ZONE = 'Asia/Seoul';

// FNV-1a 해시: 문자열을 0 ~ 4294967295 사이의 정수로 바꾼다.
// 같은 문자열은 항상 같은 숫자가 되고, 글자 하나만 달라도 전혀 다른 숫자가 된다.
export function hash(text) {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// 시간대가 올바른 이름인지 확인한다. (예: 'Asia/Seoul', 'UTC', 'America/New_York')
export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

// 주어진 시간대에서의 "오늘 날짜"를 'YYYY-MM-DD' 문자열로 돌려준다.
// 모르는 시간대가 들어오면 기본 시간대(한국)를 쓴다.
// now는 테스트에서 시각을 고정하려고 받는 값이다. 평소에는 현재 시각을 쓴다.
export function todayIn(timeZone, now = new Date()) {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  // 'en-CA' 형식은 날짜를 2026-10-11처럼 표시해 준다.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// 주어진 시간대에서 다음 자정까지 남은 시간(초)을 돌려준다.
// 운세는 자정에 바뀌므로, 이미지를 그때까지만 캐시하도록 하는 데 쓴다.
export function secondsUntilMidnight(timeZone, now = new Date()) {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  // 그 시간대의 현재 시·분·초를 읽는다.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  // 자정을 '24시'로 표시하는 환경이 있어서 시(hour)만 24로 나눈 나머지를 쓴다.
  const passed = (get('hour') % 24) * 3600 + get('minute') * 60 + get('second');
  return 24 * 3600 - passed;
}

// GitHub 아이디는 대소문자를 구분하지 않으므로 소문자로 맞춘다. (2sseul = 2SSEUL)
// 아이디가 없으면 빈 문자열이 되어 "그날의 공통 운세"가 나온다.
export function normalizeUser(user) {
  return (user ?? '').trim().toLowerCase().slice(0, 39);
}

// 오늘의 운세와 행운 아이템을 고른다.
// user: GitHub 아이디(없어도 됨), date: 'YYYY-MM-DD', lang: 'ko' 또는 'en'
export function pickFortune({ user, date, lang }) {
  const language = lang === 'en' ? 'en' : 'ko';
  const seed = `${normalizeUser(user)}|${date}`;

  // 운세 문구: 한국어·영어는 같은 번호끼리 같은 뜻이므로, 언어와 상관없이 같은 번호를 고른다.
  const list = fortunes[language];
  const fortune = list[hash(`fortune|${seed}`) % list.length];

  // 행운 아이템: 네 종류를 해시 값으로 줄 세운 뒤 앞에서 LUCKY_PER_DAY개만 보여준다.
  const lucky = luckyCategories
    .map((category) => ({ category, order: hash(`order|${category.key}|${seed}`) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, LUCKY_PER_DAY)
    .map(({ category }) => ({
      key: category.key,
      value: category.values[hash(`value|${category.key}|${seed}`) % category.values.length],
    }));

  return { fortune, lucky };
}
