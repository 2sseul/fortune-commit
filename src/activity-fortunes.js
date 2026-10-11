// GitHub 활동에 맞춘 운세 문구 모음 (5단계)
// ko와 en은 같은 번호끼리 같은 뜻이다. 문구를 고칠 때는 두 언어를 같이 고쳐 주세요.
//
// 지난 7일(어제까지) 기여 수로 '활동 단계'를 정하고, 그 단계의 문구 중 하나를 고른다.
//   fire   : 30개 이상   (열일)
//   steady : 8 ~ 29개    (꾸준)
//   warm   : 1 ~ 7개     (새싹)
//   return : 0개         (복귀 환영)
// 사흘에 한 번꼴로는 주 사용 언어가 들어간 문구가 나온다. ({lang} 자리에 언어 이름이 들어간다)
// 한국어 문구에서 {lang} 뒤에는 조사를 붙이지 않는다. (Python이/Go가 처럼 언어마다 조사가 달라서)

export const activityFortunes = {
  fire: {
    ko: [
      '잔디가 불타고 있습니다. 오늘은 물도 좀 마시세요.',
      '지난주의 당신은 전설이었습니다. 오늘은 전설도 쉬어 가도 됩니다.',
      '커밋 머신의 기운이 느껴집니다. 키보드에게도 휴식을 주세요.',
      '이 속도면 GitHub가 당신만을 위해 서버를 늘릴 운입니다.',
      '지난 7일의 잔디가 정원이 되었습니다. 오늘은 감상만 해도 됩니다.',
      '열일의 기운이 하늘을 찌릅니다. 오늘의 버그는 알아서 비켜 갑니다.',
      '이번 주 당신의 커밋 수가 팀에서 화제입니다.',
      '꾸준함이 운을 만들었습니다. 오늘은 그 운을 쓰는 날입니다.',
    ],
    en: [
      'Your contribution graph is on fire. Drink some water today.',
      'Last week you were a legend. Legends can take a break today.',
      'I sense commit-machine energy. Give your keyboard a rest too.',
      'At this pace, GitHub may add servers just for you.',
      'Your last 7 days grew into a garden. Today you can just admire it.',
      "Your hustle reaches the sky. Today's bugs will step aside.",
      'Your commit count this week is the talk of the team.',
      'Consistency made your luck. Today you get to spend it.',
    ],
  },
  steady: {
    ko: [
      '꾸준한 잔디가 당신을 응원합니다. 오늘도 한 칸 더.',
      '이번 주 리듬이 아주 좋습니다. 오늘의 커밋도 박자에 딱 맞습니다.',
      '지난주에 심은 커밋들이 오늘 열매를 맺습니다.',
      '성실한 개발자에게 오늘 귀인이 찾아옵니다.',
      '잔디가 고르게 자라고 있습니다. 정원사의 재능이 보입니다.',
      '꾸준했던 한 주 덕분에 오늘은 머지가 술술 풀립니다.',
      '이 페이스면 연말 잔디가 아주 예쁠 운입니다.',
      '매일 조금씩, 그게 바로 시니어의 비결입니다.',
    ],
    en: [
      'Your steady streak cheers you on. One more square today.',
      "Your rhythm this week is great. Today's commit hits the beat.",
      'The commits you planted last week bear fruit today.',
      'A helpful stranger visits the diligent developer today.',
      "Your graph grows evenly. You have a gardener's talent.",
      "Thanks to a steady week, today's merges go smoothly.",
      'At this pace, your year-end graph will look gorgeous.',
      "A little every day. That's the senior developer's secret.",
    ],
  },
  warm: {
    ko: [
      '잔디에 새싹이 돋고 있습니다. 오늘 물을 주면 쑥쑥 자랍니다.',
      '천천히 가도 괜찮습니다. 쿠키는 기다려 줍니다.',
      '이번 주의 작은 커밋들이 큰 행운의 씨앗이 됩니다.',
      '몸풀기는 끝났습니다. 오늘부터 본게임입니다.',
      '적당한 속도가 오래가는 비결입니다. 오늘도 딱 좋습니다.',
      '지난주보다 조금 더 초록빛인 한 주가 될 운입니다.',
      '커밋 하나하나에 정성이 보입니다. 리뷰어가 좋아할 운입니다.',
      '오늘의 커밋이 이번 주 최고의 커밋이 될지도 모릅니다.',
    ],
    en: [
      'Sprouts are appearing on your graph. Water them today.',
      'Slow is fine. The cookie will wait for you.',
      "This week's small commits are seeds of big luck.",
      "Warm-up's over. The main game starts today.",
      'A comfortable pace lasts longest. Today is just right.',
      'This week will be a little greener than last.',
      'Care shows in every commit. Reviewers will love it.',
      "Today's commit might be the best of your week.",
    ],
  },
  return: {
    ko: [
      '돌아오신 걸 환영합니다. 쿠키가 보고 싶었대요.',
      '오랜만의 커밋이네요. 잔디가 반갑다고 손을 흔듭니다.',
      '쉬는 동안 충전된 아이디어가 오늘 쏟아집니다.',
      '다시 시작하는 오늘이 가장 좋은 날입니다.',
      '오랜만에 연 에디터가 당신을 기억하고 있습니다.',
      '복귀 첫 커밋은 행운을 두 배로 불러옵니다.',
      '쿠키도 당신도 오늘부터 다시 바삭해집니다.',
      '비어 있던 잔디 사이에서 오늘의 한 칸이 가장 빛납니다.',
    ],
    en: [
      'Welcome back. The cookie missed you.',
      'A commit after a while! Your graph waves hello.',
      'Ideas you charged up while resting pour out today.',
      'Starting again today is perfect timing.',
      'Your editor still remembers you.',
      'A comeback commit brings double luck.',
      'You and the cookie get crispy again starting today.',
      "Today's square shines brightest among the empty ones.",
    ],
  },
  language: {
    ko: [
      '{lang}의 기운이 오늘 유난히 강합니다.',
      '오늘 쓰는 {lang} 코드는 한 번에 돌아갈 운입니다.',
      '{lang} 공식 문서에서 보물 같은 한 줄을 찾게 됩니다.',
      '오늘은 {lang} 장인의 손맛이 살아납니다.',
      '오늘은 {lang} 에러 메시지마저 친절하게 느껴집니다.',
      '동료가 당신의 {lang} 코드에 별을 달아 줍니다.',
      '{lang} 생태계에서 딱 맞는 라이브러리를 발견합니다.',
      '오늘 짠 {lang} 함수 하나가 오래오래 쓰입니다.',
    ],
    en: [
      'The spirit of {lang} is unusually strong today.',
      'The {lang} code you write today runs on the first try.',
      "You'll find a treasure of a line in the {lang} docs today.",
      'Today your {lang} craftsmanship shines.',
      'Even {lang} error messages feel friendly today.',
      'A teammate stars your {lang} code.',
      "You'll find the perfect library in the {lang} ecosystem.",
      'A {lang} function you write today will be used for years.',
    ],
  },
};

// 지난 7일(어제까지) 기여 수로 활동 단계를 정한다.
export function activityTier(lastWeek) {
  if (lastWeek >= 30) return 'fire';
  if (lastWeek >= 8) return 'steady';
  if (lastWeek >= 1) return 'warm';
  return 'return';
}
