// GitHub 활동에 맞춘 운세 문구 모음 (5단계)
// 오늘 커밋해서 쿠키를 연 사람이 보는 문구라, '오늘은 쉬어도 돼요'처럼 커밋과 어긋나는 말은 쓰지 않는다.
// 모든 문구는 '오늘 ~할 거예요'처럼 오늘 일어날 일을 점치는 운세로 쓰고, 말투는 자연스러운 존댓말로 맞춘다.
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
      "잔디를 열심히 가꾼 만큼, 오늘은 막혔던 문제가 쉽게 풀릴 거예요.",
      "이번 주 기세가 대단해요. 오늘 올리는 PR은 바로 승인받을 거예요.",
      "쉬지 않고 달려온 당신에게 오늘 반가운 소식이 찾아올 거예요.",
      "꾸준히 쌓은 커밋이 오늘 큰 행운으로 돌아올 거예요.",
      "오늘은 손대는 코드마다 한 번에 돌아갈 거예요.",
      "이번 주 노력을 누군가 알아봐 줄 거예요. 칭찬이 들려올 예정이에요.",
      "열심히 달려온 당신, 오늘은 버그가 알아서 피해 갈 거예요.",
      "바쁜 한 주였죠? 오늘은 생각보다 일이 일찍 끝날 거예요.",
    ],
    en: [
      "You've tended your graph well, so a stuck problem will finally give way today.",
      "Your momentum is huge. The PR you open today will get approved right away.",
      "You never stopped running, and good news is coming your way today.",
      "The commits you stacked up will come back as big luck today.",
      "Every piece of code you touch today will run on the first try.",
      "Someone will notice your effort this week. Praise is on the way.",
      "You've been grinding, so bugs will steer clear of you today.",
      "Busy week, right? Today, work will wrap up earlier than you expect.",
    ],
  },
  steady: {
    ko: [
      "꾸준히 해 온 덕분에 오늘은 머지가 충돌 없이 끝날 거예요.",
      "요즘 리듬이 좋아요. 오늘 쓰는 코드도 술술 써질 거예요.",
      "지난주에 심어 둔 커밋들이 오늘 좋은 결과로 돌아올 거예요.",
      "성실한 당신에게 오늘 귀인이 나타날 거예요. 리뷰를 부탁해 보세요.",
      "오늘은 고민하던 설계가 깔끔하게 정리될 거예요.",
      "이대로만 가면 이번 주는 큰 버그 없이 마무리될 거예요.",
      "오늘 남긴 커밋 메시지가 나중에 누군가를 구해 줄 거예요.",
      "꾸준함에 운이 붙는 날이에요. 작은 시도도 잘 풀릴 거예요.",
    ],
    en: [
      "Thanks to your steady work, today's merge will go through without conflicts.",
      "Your rhythm is good lately. Today's code will flow easily.",
      "The commits you planted last week will pay off today.",
      "A helper will show up for you today. Try asking for a review.",
      "The design you've been mulling over will fall into place today.",
      "Keep this up and you'll wrap the week without any big bugs.",
      "A commit message you write today will save someone later.",
      "Luck sticks to consistency today. Even small tries will work out.",
    ],
  },
  warm: {
    ko: [
      "새싹 같은 잔디에 오늘 물을 줬으니, 곧 쑥쑥 자랄 거예요.",
      "천천히 가도 괜찮아요. 오늘은 작은 커밋이 큰 행운을 불러올 거예요.",
      "오늘은 오래 미뤄 둔 TODO 하나를 드디어 끝내게 될 거예요.",
      "몸이 풀렸으니 오늘부터 일이 점점 잘 풀릴 거예요.",
      "오늘은 처음 보는 에러도 금방 답을 찾을 거예요.",
      "이번 주는 지난주보다 조금 더 초록색이 될 거예요.",
      "오늘 올린 작은 수정이 생각보다 큰 칭찬을 받을 거예요.",
      "오늘의 커밋이 이번 주 최고의 커밋이 될 거예요.",
    ],
    en: [
      "You watered your sprouting graph today, so it'll grow fast soon.",
      "Slow is fine. A small commit will bring big luck today.",
      "Today you'll finally finish a TODO you've been putting off.",
      "Now that you're warmed up, things will keep getting easier from today.",
      "Even an unfamiliar error will get solved fast today.",
      "This week is going to be a little greener than last.",
      "A small fix you push today will get more praise than you expect.",
      "Today's commit will be your best of the week.",
    ],
  },
  return: {
    ko: [
      "오랜만에 돌아온 오늘, 특별히 좋은 운이 따를 거예요.",
      "쉬는 동안 쌓인 아이디어가 오늘 술술 풀려 나올 거예요.",
      "다시 시작한 오늘, 첫 커밋부터 순조롭게 풀릴 거예요.",
      "오랜만에 연 에디터가 오늘은 유난히 손에 잘 맞을 거예요.",
      "복귀 첫 커밋에는 행운이 두 배로 따라올 거예요.",
      "오늘부터 잔디에 다시 초록불이 이어질 거예요.",
      "오랜만에 본 코드인데도 오늘은 금방 감이 돌아올 거예요.",
      "다시 돌아온 당신에게 오늘 반가운 연락이 올 거예요.",
    ],
    en: [
      "You're back after a while, and extra good luck will follow you today.",
      "Ideas you built up while away will pour out today.",
      "Starting again today, things will go smoothly from your first commit.",
      "Your editor will feel especially comfortable in your hands today.",
      "Your first commit back will bring double luck.",
      "From today, green squares will keep lighting up your graph again.",
      "Even after a break, you'll get your feel back quickly today.",
      "Someone will reach out with good news now that you're back.",
    ],
  },
  language: {
    ko: [
      "오늘은 {lang} 기운이 강해요. {lang} 코드가 술술 풀릴 거예요.",
      "오늘 짜는 {lang} 코드는 한 번에 돌아갈 거예요.",
      "{lang} 공식 문서에서 딱 필요한 한 줄을 찾게 될 거예요.",
      "오늘은 {lang} 실력이 한 단계 오르는 날이에요.",
      "오늘은 {lang} 에러 메시지가 원인을 정확히 알려 줄 거예요.",
      "누군가 당신의 {lang} 저장소에 별을 눌러 줄 거예요.",
      "오늘 딱 맞는 {lang} 라이브러리를 발견하게 될 거예요.",
      "오늘 만든 {lang} 함수는 오래오래 잘 쓰일 거예요.",
    ],
    en: [
      "{lang} energy is strong today. Your {lang} code will flow easily.",
      "The {lang} code you write today will run on the first try.",
      "You'll find exactly the line you need in the {lang} docs today.",
      "Your {lang} skills will level up today.",
      "{lang} error messages will point straight to the cause today.",
      "Someone will star your {lang} repository.",
      "You'll discover the perfect {lang} library today.",
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
