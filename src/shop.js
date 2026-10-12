// 쿠키 상점: 상품 목록과 포인트 계산 (v2.2)
//
// 포인트 = 올해 기여 × 10 + 올해 출석 × 30 − 올해 쓴 포인트
//   - 출석: 오늘 커밋해서 쿠키가 열린 날, 사이트에서 쿠키를 열면 하루 한 번
//   - 포인트는 매년 1월 1일에 새로 시작하지만, 산 물건은 계속 내 것이다.
//
// 상품 아이디는 '종류:이름' 꼴이다. (예: 'skin:cat', 'theme:strawberry')

export const POINTS_PER_CONTRIBUTION = 10;
export const POINTS_PER_ATTENDANCE = 30;

// 판매하는 스킨. 여기 없는 스킨(황금, 호박, 눈사람, 사슴, 산타)은 업적으로만 받는다.
export const SKIN_PRICES = {
  choco: 500,
  cat: 1200,
  dog: 1200,
  rabbit: 1200,
  matcha: 1500,
};

// 판매하는 터미널 테마 (색은 src/themes.js)
export const THEME_PRICES = {
  vanilla: 300,
  strawberry: 400,
  mintchoco: 400,
  blueberry: 400,
  darkchoco: 500,
};

// 상품 아이디 → { id, kind, name, price }. 없는 상품이면 null.
export function findItem(itemId) {
  const [kind, name] = String(itemId ?? '').split(':');
  const prices = kind === 'skin' ? SKIN_PRICES : kind === 'theme' ? THEME_PRICES : null;
  if (!prices || !Object.hasOwn(prices, name)) return null;
  return { id: `${kind}:${name}`, kind, name, price: prices[name] };
}

// 전체 상품 목록 (가격이 싼 것부터)
export function catalog() {
  const items = [
    ...Object.keys(SKIN_PRICES).map((name) => findItem(`skin:${name}`)),
    ...Object.keys(THEME_PRICES).map((name) => findItem(`theme:${name}`)),
  ];
  return items.sort((a, b) => a.kind.localeCompare(b.kind) || a.price - b.price);
}

// 지갑 계산
//   contributions : 올해 기여 수, attendance: 올해 출석한 날 수, spent: 올해 쓴 포인트
export function wallet({ contributions = 0, attendance = 0, spent = 0 }) {
  const fromContributions = contributions * POINTS_PER_CONTRIBUTION;
  const fromAttendance = attendance * POINTS_PER_ATTENDANCE;
  const earned = fromContributions + fromAttendance;
  return { fromContributions, fromAttendance, earned, spent, balance: Math.max(0, earned - spent) };
}
