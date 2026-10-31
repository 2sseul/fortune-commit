// 주소 옵션(width, radius, hide_border)을 검사하는 모듈
// 사람이 직접 입력하는 값이라 이상한 값이 들어올 수 있다. (예: width=abc, radius=-5)
// - 숫자가 아니거나 비어 있으면 → 기본값
// - 숫자지만 범위를 벗어나면 → 가장 가까운 허용값으로 맞춘다 (예: width=9999 → 1000, width=300 → 495)
// - width=full → README 칸 끝까지 (840으로 그린다)

export const STYLE_LIMITS = {
  // v3: 기본 크기(495)가 최소 — 더 좁으면 운세 문장이 너무 잘게 줄바꿈된다. 최대 1000.
  width: { default: 495, min: 495, max: 1000 },
  radius: { default: 10, min: 0, max: 30 },
};

// 숫자 옵션 하나를 검사한다.
function parseNumber(raw, { default: fallback, min, max }) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

// true/false 옵션을 검사한다. true, 1, yes만 켜진 것으로 본다.
function parseBoolean(raw) {
  return ['true', '1', 'yes'].includes(String(raw ?? '').trim().toLowerCase());
}

// URLSearchParams에서 모양 옵션을 읽어 안전한 값으로 돌려준다.
// width=full: README 칸 끝까지 (README에서는 <img width="100%">로 늘려 보여준다).
//   README 본문 칸이 보통 830~880px이라 그만큼 넓게 그려서, 늘렸을 때 글자가 흐려지거나 커지지 않게 한다.
export const FULL_WIDTH = 840;

export function parseStyleOptions(searchParams) {
  const full = String(searchParams.get('width') ?? '').trim().toLowerCase() === 'full';
  return {
    width: full ? FULL_WIDTH : parseNumber(searchParams.get('width'), STYLE_LIMITS.width),
    radius: parseNumber(searchParams.get('radius'), STYLE_LIMITS.radius),
    hideBorder: parseBoolean(searchParams.get('hide_border')),
  };
}
