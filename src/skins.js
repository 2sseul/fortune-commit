// 쿠키 스킨 모음 (v2)
// 디자인 원본: img/*-fortune-cookie.png (사용자가 만든 오리지널 그림). 그림을 보며 픽셀로 다시 그렸다.
//
// 스킨 하나는 이렇게 생겼다.
//   label   : 화면에 보여줄 이름 (한국어/영어)
//   palette : 쿠키 색 바꾸기. O=테두리, B=몸통, H=빛 받는 부분, S=그림자 (쪽지 색 P, L은 테마를 따른다)
//   recolor : 쿠키의 일부 영역 색 바꾸기 (예: 산타의 흰 털, 눈사람의 목도리)
//             { piece: 'front'|'back', rows: [시작, 끝], cols: [시작, 끝], to: { B: '새 글자', ... } }
//   parts   : 쿠키 위에 얹는 작은 픽셀 그림 (귀, 모자, 리본 등)
//             { at: [행, 열], shape: [...] } — shape의 왼쪽 위 칸이 at 위치에 온다. 행이 음수면 쿠키보다 위쪽이다.
//             shape 글자: '.'은 비움, 대문자는 앞쪽 조각, 소문자는 뒤쪽 날개에 붙는다. (갈라질 때 같이 움직인다)
// 꾸밈 글자의 색은 아래 DECOR_COLORS를 쓰고, O·B·H·S는 스킨 색을 따른다.

export const DECOR_COLORS = {
  K: '#1F1A17', // 검정 (모자, 벨트, 호박 얼굴)
  I: '#F2A0B0', // 분홍 (귀 안쪽)
  D: '#7A4A2A', // 갈색 (강아지 귀)
  M: '#E3A15F', // 황갈색 (강아지 얼룩)
  T: '#6B3F22', // 진갈색 (사슴뿔)
  R: '#D7263D', // 빨강 (리본, 산타 모자, 목도리)
  E: '#A3172A', // 진빨강 (빨간 부분의 그림자)
  Y: '#F7C948', // 금색 (방울, 버클, 반짝이)
  A: '#E09B12', // 호박색 (반짝이 빛줄기, 방울 그림자)
  W: '#FFFFFF', // 흰색 (반짝이 가운데)
  F: '#F4F1EC', // 털 흰색 (산타 털, 모자 끝 방울)
  U: '#D3CBBE', // 털 그림자
  G: '#3F7A24', // 진초록 (호박 꼭지)
  J: '#7FC24A', // 연초록 (호박 꼭지 빛)
  N: '#F28C28', // 주황 (눈사람 당근 코)
  V: '#C65F0E', // 진주황 (당근 코 그림자)
};

// 동물 쿠키가 함께 쓰는 크림색 쿠키
const CREAM = { O: '#5C3310', B: '#F6D9A8', H: '#FFF3DC', S: '#DDB27A' };

export const SKINS = {
  plain: {
    label: { ko: '기본 쿠키', en: 'Plain cookie' },
  },

  // 맛·색 변형
  choco: {
    label: { ko: '초코 쿠키', en: 'Choco cookie' },
    palette: { O: '#2A160B', B: '#7A4426', H: '#B07448', S: '#53291A' },
  },
  matcha: {
    label: { ko: '말차 쿠키', en: 'Matcha cookie' },
    palette: { O: '#2F3D12', B: '#9BBF4A', H: '#D4EA8C', S: '#6E8C2E' },
  },
  gold: {
    label: { ko: '황금 쿠키', en: 'Golden cookie' },
    palette: { O: '#6B4A06', B: '#F5C21B', H: '#FFF1A8', S: '#C8930A' },
    // 네 갈래 반짝이 세 개
    parts: [
      { at: [-4, -1], shape: ['..A..', '..Y..', 'AYWYA', '..Y..', '..A..'] },
      { at: [3, 24], shape: ['.a.', 'ayw', '.a.'] },
      { at: [19, 20], shape: ['..A..', '..Y..', 'AYWYA', '..Y..', '..A..'] },
    ],
  },

  // 동물 (얼굴 없이 크림색 쿠키에 귀만 단다)
  cat: {
    label: { ko: '고양이 쿠키', en: 'Cat cookie' },
    palette: CREAM,
    parts: [
      // 앞쪽 조각 왼쪽 위의 세모 귀
      { at: [-3, 3], shape: ['..O....', '..OO...', '..OIO..', '.OIIO..', '.OIIIOO', 'OIIIIBB', 'OBBBBB.', '.O.....'] },
      // 뒤쪽 날개 위의 세모 귀
      { at: [-1, 18], shape: ['.....o', '....oo', '...oio', '..oiio', '.oiiio', 'oiiiio', 'obbbbo', '..bbbo'] },
    ],
  },
  dog: {
    label: { ko: '강아지 쿠키', en: 'Puppy cookie' },
    palette: CREAM,
    parts: [
      // 양쪽으로 처진 갈색 귀
      { at: [1, 0], shape: ['...OOOO.', '..ODDDDO', '.ODDDDDO', 'ODDDDDO.', 'ODDDDO..', 'ODDDO...', '.OOO....'] },
      { at: [4, 19], shape: ['.ooo..', 'odddo.', 'oddddo', '.odddo', '..oddo', '...oo.'] },
      // 황갈색 얼룩
      { at: [11, 4], shape: ['MM', 'MMM', '.M'] },
      { at: [16, 9], shape: ['.MM', 'MMM'] },
      { at: [8, 9], shape: ['MM'] },
      { at: [9, 18], shape: ['mm', 'mmm'] },
      { at: [14, 21], shape: ['mm', '.mm'] },
    ],
  },
  rabbit: {
    label: { ko: '토끼 쿠키', en: 'Bunny cookie' },
    palette: CREAM,
    parts: [
      // 앞쪽: 위로 쫑긋 선 긴 귀
      { at: [-8, 5], shape: ['.OOO..', 'OBIBO.', 'OBIIBO', 'OBIIBO', 'OBIIBO', '.OBIBO', '.OBIBO', '.OBIBO', '.OBBBO', '..OBBO'] },
      // 뒤쪽: 길게 섰다가 끝이 오른쪽으로 접힌 귀
      { at: [-6, 16], shape: ['....oooo..', '...obbiio.', '..obiiibo.', '..obiio...', '..obio....', '..obio....', '..obio....', '.obbo.....', 'obbo......'] },
    ],
  },

  // 시즌
  pumpkin: {
    label: { ko: '호박 쿠키', en: 'Pumpkin cookie' },
    hasFace: true, // 호박 얼굴이 이미 있어서 캐릭터 얼굴을 덧그리지 않는다.
    palette: { O: '#5A2A04', B: '#F28C28', H: '#FFC070', S: '#C25E0E' },
    parts: [
      // 초록 꼭지
      { at: [-4, 12], shape: ['..GJ', '.GJ.', '.G..', 'GG..'] },
      // 세모 눈
      { at: [8, 3], shape: ['...K', '..KK', '.KKK'] },
      { at: [8, 9], shape: ['K...', 'KK..', 'KKK.'] },
      // 지그재그로 웃는 입
      { at: [13, 3], shape: ['K.........K', 'KK.KK.KK.KK', '.KKKKKKKKK.', '..K..K..K..'] },
    ],
  },
  snowman: {
    label: { ko: '눈사람 쿠키', en: 'Snowman cookie' },
    palette: { O: '#4A5A6A', B: '#F2F6FA', H: '#FFFFFF', S: '#C8D4E0' },
    recolor: [
      // 아래쪽에 빨간 목도리
      { piece: 'front', rows: [18, 20], cols: [0, 20], to: { B: 'R', H: 'R', S: 'E' } },
    ],
    parts: [
      // 빨간 띠를 두른 검은 모자
      { at: [-5, 8], shape: ['..KKKKKK..', '..KKKKKK..', '..KKKKKK..', '..RRRRRR..', '..KKKKKK..', 'KKKKKKKKKK'] },
      // 당근 코 (뒤쪽 날개에서 오른쪽으로)
      { at: [11, 17], shape: ['nnnn.', 'vnnnn', 'vv...'] },
      // 늘어진 목도리 끝
      { at: [20, 7], shape: ['RRR', 'RER', 'RER', 'R.R'] },
    ],
  },
  deer: {
    label: { ko: '사슴 쿠키', en: 'Reindeer cookie' },
    palette: CREAM,
    parts: [
      // 사슴뿔 두 개
      { at: [-6, 4], shape: ['T..T....', 'TT.T..T.', '.TTT.TT.', '..TTTT..', '...TT...', '...TT...', '...TT...'] },
      { at: [-2, 17], shape: ['t..t....', 'tt.t..t.', '.ttt.tt.', '..tttt..', '...tt...', '...tt...', '...tt...', '...tt...'] },
      // 작은 귀
      { at: [1, 1], shape: ['OOO..', 'OIIBO', '.OIBO', '..OO.'] },
      { at: [5, 22], shape: ['..ooo', '.obiio', 'obiio.', '.oo...'] },
      // 빨간 리본과 금방울
      { at: [16, 3], shape: ['.RR...RR.', 'RRRR.RRRR', 'RERRYRRER', '.RR.Y.RR.', '...YYY...', '...YAY...'] },
    ],
  },
  santa: {
    label: { ko: '산타 쿠키', en: 'Santa cookie' },
    palette: { O: '#5A0F14', B: '#D7263D', H: '#F25C6E', S: '#A3172A' },
    recolor: [
      // 아래쪽 흰 털 장식
      { piece: 'front', rows: [19, 25], cols: [0, 20], to: { B: 'F', H: 'F', S: 'U' } },
      { piece: 'back', rows: [16, 18], cols: [0, 26], to: { b: 'f', h: 'f', s: 'u' } },
      // 검은 벨트
      { piece: 'front', rows: [15, 16], cols: [0, 15], to: { B: 'K', H: 'K', S: 'K' } },
    ],
    parts: [
      // 금색 버클
      { at: [14, 6], shape: ['YYYY', 'YKKY', 'YKKY', 'YYYY'] },
      // 흰 털이 달린 산타 모자 (끝의 방울은 오른쪽)
      { at: [-3, 9], shape: [
        '.....RRRR.........',
        '...RRRRRRRRR......',
        '..RRRRRRRRRRRRR...',
        '.FFFFFFFFFFRRRRR..',
        'FFFFFFFFFFF...RRF.',
        '..............FFF.',
      ] },
    ],
  },
};

// 사이트에서 쿠키를 캐릭터로 쓸 때 앞쪽 조각에 그리는 얼굴 (눈, 볼터치, 웃는 입)
export const CHARACTER_FACE = [
  { at: [9, 4], shape: ['KK', 'KW'] },
  { at: [9, 9], shape: ['KK', 'KW'] },
  { at: [12, 2], shape: ['II'] },
  { at: [12, 11], shape: ['II'] },
  { at: [12, 6], shape: ['K.K', '.K.'] },
];

// 스킨에 캐릭터 얼굴을 더한 복사본을 만든다. (원래 스킨은 바꾸지 않는다)
export function withFace(skin) {
  if (skin.hasFace) return skin;
  return { ...skin, parts: [...(skin.parts ?? []), ...CHARACTER_FACE] };
}

// 이름으로 스킨을 찾는다. 모르는 이름이면 기본 쿠키.
export function getSkin(name) {
  return SKINS[name] ? { id: name, ...SKINS[name] } : { id: 'plain', ...SKINS.plain };
}
