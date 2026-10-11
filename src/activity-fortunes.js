// GitHub 활동에 맞춘 운세 문구 모음 (5단계)
// 오늘 커밋해서 쿠키를 연 사람이 보는 문구라, '오늘은 쉬어도 돼요'처럼 커밋과 어긋나는 말은 쓰지 않는다.
// 말투는 친근한 존댓말(~네요, ~거예요)로 맞춘다.
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
      "잔디가 빽빽하게 자랐네요. 오늘 커밋으로 한 칸 더 채웠어요.",
      "지난주 정말 열심히 달렸네요. 오늘도 그 기세 그대로 가요.",
      "요즘 커밋하는 손이 멈추질 않네요. 물 한 잔 마시고 계속해요.",
      "이 정도면 잔디밭이 아니라 숲이에요.",
      "일주일 내내 초록색이었어요. 오늘도 초록 한 칸 추가!",
      "꾸준히 쌓은 커밋 덕분에 오늘은 일이 술술 풀릴 거예요.",
      "이번 주 커밋 수, 팀에서 소문났대요.",
      "열심히 한 만큼 오늘은 좋은 일이 생길 거예요.",
    ],
    en: [
      "Your graph is packed. Today's commit filled in one more square.",
      "You worked really hard last week. Keep that momentum going today.",
      "Your commits just keep coming. Grab some water and keep going.",
      "At this point it's not a lawn, it's a forest.",
      "Green all week long. One more green square today!",
      "Thanks to all those commits, things will go smoothly today.",
      "Word is your commit count is the talk of the team.",
      "All that effort pays off. Something good is coming today.",
    ],
  },
  steady: {
    ko: [
      "꾸준함이 제일 무서운 거 아시죠? 오늘도 한 칸 채웠어요.",
      "요즘 리듬 좋네요. 오늘 커밋도 딱 박자에 맞았어요.",
      "지난주에 심어 둔 커밋들이 오늘 빛을 볼 거예요.",
      "성실하게 하는 사람한테는 결국 좋은 일이 생겨요.",
      "잔디가 고르게 잘 자라고 있어요. 이대로만 가요.",
      "이번 주도 잘 해내고 있어요. 오늘 머지는 무난하게 될 거예요.",
      "이 페이스면 연말 잔디가 정말 예쁠 거예요.",
      "매일 조금씩 하는 게 결국 제일 멀리 가요.",
    ],
    en: [
      "You know consistency is the scariest skill, right? Another square today.",
      "Nice rhythm lately. Today's commit landed right on the beat.",
      "The commits you planted last week will shine today.",
      "Good things come to people who keep showing up.",
      "Your graph is growing nicely and evenly. Keep it up.",
      "You're doing great this week. Today's merge will go smoothly.",
      "At this pace, your year-end graph is going to look great.",
      "A little every day goes the farthest.",
    ],
  },
  warm: {
    ko: [
      "잔디에 새싹이 올라오고 있어요. 오늘 커밋으로 물 줬네요.",
      "천천히 가도 괜찮아요. 오늘 한 것만으로도 충분해요.",
      "작은 커밋이 모이면 큰 행운이 돼요.",
      "슬슬 몸이 풀리는 느낌이죠? 이제부터 진짜 시작이에요.",
      "무리하지 않는 속도가 오래가요. 지금 딱 좋아요.",
      "이번 주는 지난주보다 조금 더 초록색일 거예요.",
      "커밋 하나하나에 정성이 보여요. 리뷰어가 좋아할 거예요.",
      "오늘 커밋이 이번 주 최고의 커밋일지도 몰라요.",
    ],
    en: [
      "Sprouts are coming up. Today's commit just watered them.",
      "Slow is fine. What you did today is enough.",
      "Small commits add up to big luck.",
      "Feeling warmed up? This is where it really starts.",
      "A pace you can keep lasts longest. You're right on it.",
      "This week will be a little greener than last.",
      "The care shows in every commit. Reviewers will love it.",
      "Today's commit might be your best one this week.",
    ],
  },
  return: {
    ko: [
      "오랜만이에요! 쿠키가 기다리고 있었어요.",
      "오랜만에 잔디에 초록불이 켜졌네요.",
      "쉬는 동안 충전 잘 했죠? 오늘 아이디어가 술술 나올 거예요.",
      "다시 시작한 오늘이 제일 좋은 타이밍이에요.",
      "에디터가 반갑다고 인사하네요.",
      "돌아와서 한 첫 커밋엔 행운이 두 배로 따라와요.",
      "오늘부터 다시 바삭바삭하게 가 봐요.",
      "텅 빈 잔디 사이에서 오늘 한 칸이 제일 반짝여요.",
    ],
    en: [
      "Long time no see! The cookie was waiting for you.",
      "Your graph lit up green again after a while.",
      "Recharged while you were away? Ideas will flow today.",
      "Coming back today is perfect timing.",
      "Your editor says welcome back.",
      "Your first commit back brings double luck.",
      "Let's get crispy again starting today.",
      "Today's square shines brightest on an empty graph.",
    ],
  },
  language: {
    ko: [
      "오늘은 {lang} 기운이 유난히 좋네요.",
      "오늘 짜는 {lang} 코드는 한 번에 돌아갈 거예요.",
      "{lang} 공식 문서에서 딱 필요한 한 줄을 찾게 될 거예요.",
      "오늘은 {lang} 고수 모드가 켜지는 날이에요.",
      "오늘은 {lang} 에러 메시지도 친절하게 느껴질 거예요.",
      "누군가 당신의 {lang} 코드에 별을 눌러 줄 거예요.",
      "찾던 {lang} 라이브러리를 오늘 딱 맞게 발견할 거예요.",
      "오늘 만든 {lang} 함수, 오래오래 잘 쓰일 거예요.",
    ],
    en: [
      "{lang} vibes are especially good today.",
      "The {lang} code you write today will run on the first try.",
      "You'll find exactly the line you need in the {lang} docs.",
      "Today your {lang} pro mode switches on.",
      "Even {lang} error messages will feel friendly today.",
      "Someone is going to star your {lang} code.",
      "You'll find the perfect {lang} library today.",
      "The {lang} function you write today will be used for years.",
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
