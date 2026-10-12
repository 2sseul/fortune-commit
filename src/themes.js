// 위젯 색상 테마 모음 (터미널 색 구성표)
// 위젯은 항상 터미널 창 모양이고, 테마는 터미널의 배경·글자 색만 바꾼다.
// 픽셀 쿠키는 "실제 물건"이라 두 테마에서 같은 색을 쓴다.

// 픽셀 쿠키 색 (src/cookie.js의 픽셀 지도 글자와 짝을 이룬다)
const cookie = {
  O: '#5C3310', // 테두리 (진한 갈색)
  B: '#E8A23C', // 기본 몸통 (황금빛)
  H: '#FFD98A', // 빛 받는 부분
  S: '#B86E1E', // 접힌 안쪽 그림자
  P: '#FFF8E7', // 운세 쪽지 종이
  L: '#E05D44', // 쪽지 위 빨간 글씨 줄
};

export const themes = {
  dark: {
    window: '#0D1117', // 터미널 본문 배경
    titlebar: '#161B22', // 위쪽 타이틀바
    border: '#30363D', // 창 테두리
    titleText: '#8B949E', // 타이틀바 글자
    text: '#E6EDF3', // 일반 글자 (입력한 명령어)
    prompt: '#3FB950', // $ 프롬프트 (초록)
    fortune: '#F2CC60', // 운세 문구 (노랑)
    key: '#79C0FF', // lucky_status 같은 키 (파랑)
    operator: '#8B949E', // = 기호 (회색)
    value: '#FFA657', // "200 OK" 같은 값 (주황)
    cursor: '#E6EDF3', // 깜빡이는 커서
    cookie,
  },
  light: {
    window: '#FAFAF7',
    titlebar: '#EAEAE6',
    border: '#D0D7DE',
    titleText: '#6E7781',
    text: '#24292F',
    prompt: '#1A7F37',
    fortune: '#9A6700',
    key: '#0550AE',
    operator: '#6E7781',
    value: '#BC4C00',
    cursor: '#24292F',
    // 밝은 배경에서는 크림색 쪽지가 묻혀 보여서 쪽지만 조금 진하게 한다.
    cookie: { ...cookie, P: '#F1DDB0' },
  },
};

// 쿠키 상점에서 파는 디저트 테마 (v2.2). 상점에서 사서 장착해야 위젯에 나온다.
// 밝은 바탕 테마는 쪽지 종이를 조금 진하게 한다. (light 테마와 같은 이유)
export const shopThemes = {
  vanilla: { // 바닐라 크림
    window: '#FFF8EC', titlebar: '#F3E6CF', border: '#E3CFAE', titleText: '#9C8463',
    text: '#4A3727', prompt: '#C98A2E', fortune: '#8A5A1F', key: '#B5651D',
    operator: '#A08C72', value: '#D9822B', cursor: '#4A3727',
    cookie: { ...cookie, P: '#F1DDB0' },
  },
  strawberry: { // 딸기우유
    window: '#FFF0F4', titlebar: '#FBDCE5', border: '#F2BACA', titleText: '#B9798B',
    text: '#5A2E3A', prompt: '#E0567A', fortune: '#C2335B', key: '#D2648A',
    operator: '#B9798B', value: '#E06C5A', cursor: '#5A2E3A',
    cookie: { ...cookie, P: '#F6E2C0' },
  },
  mintchoco: { // 민트초코
    window: '#2B1D18', titlebar: '#3A2820', border: '#4E3A2F', titleText: '#A9D9C9',
    text: '#E9FFF7', prompt: '#6FE0C0', fortune: '#9EF0D8', key: '#6FE0C0',
    operator: '#8C7466', value: '#F6C9A8', cursor: '#9EF0D8',
    cookie,
  },
  blueberry: { // 블루베리 요거트
    window: '#F4F2FF', titlebar: '#E3DEFA', border: '#CBC3F0', titleText: '#7E74B8',
    text: '#2F2A55', prompt: '#6C5CE7', fortune: '#5546C9', key: '#7B6FD6',
    operator: '#8E86B8', value: '#C05A9A', cursor: '#2F2A55',
    cookie: { ...cookie, P: '#F1DDB0' },
  },
  darkchoco: { // 다크 초콜릿
    window: '#1E1410', titlebar: '#2A1C16', border: '#3D2A20', titleText: '#A48A78',
    text: '#F3E3D3', prompt: '#E0A060', fortune: '#F5D08A', key: '#E7B98E',
    operator: '#8E7262', value: '#F28C5A', cursor: '#F3E3D3',
    cookie,
  },
};

// 테마 이름을 받아 테마 객체를 돌려준다. 모르는 이름이면 다크 테마를 쓴다.
// 디저트 테마는 산 사람이 장착했을 때와 미리보기(allowShop)에서만 쓴다.
export function getTheme(name, { allowShop = false } = {}) {
  if (allowShop && Object.hasOwn(shopThemes, name)) return shopThemes[name];
  return Object.hasOwn(themes, name) ? themes[name] : themes.dark;
}
