// 주소 옵션(width, radius, hide_border)을 검사하는 모듈
// 사람이 직접 입력하는 값이라 이상한 값이 들어올 수 있다. (예: width=abc, radius=-5)
// - 숫자가 아니거나 비어 있으면 → 기본값
// - 숫자지만 범위를 벗어나면 → 가장 가까운 허용값으로 맞춘다 (예: width=9999 → 800)

export const STYLE_LIMITS = {
  width: { default: 495, min: 400, max: 800 }, // 너무 좁으면 글자가 안 들어가서 400부터
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
export function parseStyleOptions(searchParams) {
  return {
    width: parseNumber(searchParams.get('width'), STYLE_LIMITS.width),
    radius: parseNumber(searchParams.get('radius'), STYLE_LIMITS.radius),
    hideBorder: parseBoolean(searchParams.get('hide_border')),
  };
}
