// 쿠키 스킨 모음 (v2)
// 모든 스킨은 오리지널 그림이다. (기존 캐릭터를 따라 그리지 않는다)
//
// 스킨 하나는 이렇게 생겼다.
//   label   : 화면에 보여줄 이름 (한국어/영어)
//   palette : 쿠키 색 바꾸기. O=테두리, B=몸통, H=빛 받는 부분, S=그림자 (쪽지 색 P, L은 테마를 따른다)
//   ears    : 쿠키 윗부분에 붙이는 귀 모양. shape는 아래쪽이 쿠키에 닿는 작은 픽셀 지도, columns는 귀를 붙일 열
//   pixels  : 쿠키 위에 덧그리는 픽셀 [행, 열, 글자]. 행이 음수면 쿠키보다 위쪽이다.
// 덧그리는 픽셀의 글자 색은 아래 DECOR_COLORS를 쓴다. (B, O 등 쿠키 글자를 쓰면 스킨 색을 따른다)

export const DECOR_COLORS = {
  K: '#2B1B12', // 눈 (진한 갈색)
  I: '#F4A6B8', // 볼터치, 귀 안쪽 (분홍)
  D: '#8A5A33', // 강아지 귀 (갈색)
  G: '#4E8A2E', // 호박 꼭지 (초록)
  N: '#F28C28', // 눈사람 당근 코 (주황)
  Y: '#FFE27A', // 반짝이 가운데 (연노랑)
  A: '#F0A81C', // 반짝이 빛줄기 (호박색, 밝은 바탕에서도 보이게)
};

// 동물 쿠키에 공통으로 넣는 얼굴 (앞쪽 조각 가운데)
const FACE = [
  [10, 5, 'K'], [10, 9, 'K'], // 눈
  [12, 4, 'I'], [12, 10, 'I'], // 볼터치
];

export const SKINS = {
  plain: {
    label: { ko: '기본 쿠키', en: 'Plain cookie' },
    palette: {},
  },

  // 맛·색 변형
  choco: {
    label: { ko: '초코 쿠키', en: 'Choco cookie' },
    palette: { O: '#2E1A0E', B: '#7B4A2A', H: '#A8714B', S: '#5A341C' },
  },
  matcha: {
    label: { ko: '말차 쿠키', en: 'Matcha cookie' },
    palette: { O: '#33451A', B: '#8DB255', H: '#B9D98A', S: '#627F35' },
  },
  gold: {
    label: { ko: '황금 쿠키', en: 'Golden cookie' },
    palette: { O: '#6B4E0A', B: '#F5C542', H: '#FFF1A8', S: '#C99A1A' },
    // 쿠키 주변의 반짝이 (가운데 Y + 상하좌우 빛줄기 A)
    pixels: [
      [-2, 20, 'Y'], [-3, 20, 'A'], [-1, 20, 'A'], [-2, 19, 'A'], [-2, 21, 'A'],
      [4, -2, 'Y'], [3, -2, 'A'], [5, -2, 'A'], [4, -3, 'A'], [4, -1, 'A'],
      [20, 22, 'Y'], [19, 22, 'A'], [21, 22, 'A'], [20, 21, 'A'], [20, 23, 'A'],
    ],
  },

  // 동물
  cat: {
    label: { ko: '고양이 쿠키', en: 'Cat cookie' },
    palette: {},
    ears: {
      shape: [
        '..O..',
        '.OIO.',
        '.OIO.',
        'OBIBO',
      ],
      columns: [6, 13],
    },
    pixels: FACE,
  },
  dog: {
    label: { ko: '강아지 쿠키', en: 'Dog cookie' },
    palette: {},
    ears: {
      shape: [
        '.OO..',
        'ODDO.',
        'ODDDO',
        'ODDDO',
      ],
      columns: [6, 13],
    },
    pixels: [...FACE, [11, 7, 'K']], // 코
  },
  rabbit: {
    label: { ko: '토끼 쿠키', en: 'Bunny cookie' },
    palette: {},
    ears: {
      shape: [
        '.O.',
        'OIO',
        'OIO',
        'OIO',
        'OBO',
      ],
      columns: [7, 12],
    },
    pixels: FACE,
  },

  // 시즌
  pumpkin: {
    label: { ko: '호박 쿠키', en: 'Pumpkin cookie' },
    palette: { O: '#6B3305', B: '#F28C28', H: '#FFB866', S: '#C25E0E' },
    ears: {
      shape: [
        '.GG',
        'GG.',
      ],
      columns: [13],
    },
    // 호박 얼굴 (세모 눈, 웃는 입)
    pixels: [
      [9, 5, 'K'], [10, 4, 'K'], [10, 5, 'K'], [10, 6, 'K'],
      [9, 9, 'K'], [10, 8, 'K'], [10, 9, 'K'], [10, 10, 'K'],
      [13, 4, 'K'], [14, 5, 'K'], [14, 6, 'K'], [14, 7, 'K'], [14, 8, 'K'], [14, 9, 'K'], [13, 10, 'K'],
    ],
  },
  snow: {
    label: { ko: '눈사람 쿠키', en: 'Snowman cookie' },
    palette: { O: '#5B6B7C', B: '#EEF3F8', H: '#FFFFFF', S: '#C3D0DE' },
    pixels: [
      [10, 5, 'K'], [10, 9, 'K'], // 눈
      [11, 7, 'N'], [11, 8, 'N'], [11, 9, 'N'], // 당근 코
      [13, 5, 'K'], [14, 6, 'K'], [14, 7, 'K'], [14, 8, 'K'], [13, 9, 'K'], // 웃는 입
    ],
  },
};

// 이름으로 스킨을 찾는다. 모르는 이름이면 기본 쿠키.
export function getSkin(name) {
  return SKINS[name] ? { id: name, ...SKINS[name] } : { id: 'plain', ...SKINS.plain };
}
