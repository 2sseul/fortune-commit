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

// 테마 이름을 받아 테마 객체를 돌려준다. 모르는 이름이면 다크 테마를 쓴다.
export function getTheme(name) {
  return themes[name] ?? themes.dark;
}
