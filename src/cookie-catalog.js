// 쿠키 65종 목록, 뽑기 설정, 상점 아이템 (v3)

// 이 파일은 scripts/sync-cookies.mjs가 design/cookies/catalog.json에서 만든다. 직접 고치지 말고 catalog.json을 고친 뒤 다시 만든다.

export const COOKIES = [
 {
  "id": "plain",
  "label": "기본 쿠키",
  "category": "기존",
  "unlock": "처음부터",
  "data": "now"
 },
 {
  "id": "choco",
  "label": "초코 쿠키",
  "category": "기존",
  "unlock": "올해 기여 50개",
  "data": "now"
 },
 {
  "id": "matcha",
  "label": "말차 쿠키",
  "category": "기존",
  "unlock": "올해 기여 150개",
  "data": "now"
 },
 {
  "id": "gold",
  "label": "황금 쿠키",
  "category": "기존",
  "unlock": "올해 7일 연속 기여",
  "data": "now"
 },
 {
  "id": "cat",
  "label": "고양이 쿠키",
  "category": "기존",
  "unlock": "올해 커밋 100개",
  "data": "now"
 },
 {
  "id": "dog",
  "label": "강아지 쿠키",
  "category": "기존",
  "unlock": "올해 PR 10개",
  "data": "now"
 },
 {
  "id": "rabbit",
  "label": "토끼 쿠키",
  "category": "기존",
  "unlock": "올해 코드 리뷰 10개",
  "data": "now"
 },
 {
  "id": "pumpkin",
  "label": "호박 쿠키",
  "category": "기존",
  "unlock": "10월 기여 10개",
  "data": "now"
 },
 {
  "id": "snowman",
  "label": "눈사람 쿠키",
  "category": "기존",
  "unlock": "12월 기여 10개",
  "data": "now"
 },
 {
  "id": "deer",
  "label": "사슴 쿠키",
  "category": "기존",
  "unlock": "12월 기여 30개",
  "data": "now"
 },
 {
  "id": "santa",
  "label": "산타 쿠키",
  "category": "기존",
  "unlock": "크리스마스에 기여",
  "data": "now"
 },
 {
  "id": "owl",
  "label": "올빼미 쿠키",
  "category": "활동",
  "unlock": "자정~새벽 5시 활동 10번",
  "data": "events"
 },
 {
  "id": "weekend",
  "label": "주말 쿠키",
  "category": "활동",
  "unlock": "주말에 기여한 날 20일",
  "data": "now"
 },
 {
  "id": "merge",
  "label": "머지 쿠키",
  "category": "활동",
  "unlock": "PR 머지 10개",
  "data": "api"
 },
 {
  "id": "streak",
  "label": "불꽃 쿠키",
  "category": "활동",
  "unlock": "연속 기록 30일",
  "data": "site"
 },
 {
  "id": "sakura",
  "label": "벚꽃 쿠키",
  "category": "시즌",
  "unlock": "4월 기여 10개",
  "data": "now"
 },
 {
  "id": "watermelon",
  "label": "수박 쿠키",
  "category": "시즌",
  "unlock": "8월 기여 10개",
  "data": "now"
 },
 {
  "id": "maple",
  "label": "단풍 쿠키",
  "category": "시즌",
  "unlock": "11월 기여 10개",
  "data": "now"
 },
 {
  "id": "crab",
  "label": "Rust 쿠키",
  "category": "언어",
  "unlock": "올해 Rust 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "python",
  "label": "Python 쿠키",
  "category": "언어",
  "unlock": "올해 Python 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "coffee",
  "label": "Java 쿠키",
  "category": "언어",
  "unlock": "올해 Java 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "javascript",
  "label": "JavaScript 쿠키",
  "category": "언어",
  "unlock": "올해 JavaScript 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "typescript",
  "label": "TypeScript 쿠키",
  "category": "언어",
  "unlock": "올해 TypeScript 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "go",
  "label": "Go 쿠키",
  "category": "언어",
  "unlock": "올해 Go 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "kotlin",
  "label": "Kotlin 쿠키",
  "category": "언어",
  "unlock": "올해 Kotlin 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "swift",
  "label": "Swift 쿠키",
  "category": "언어",
  "unlock": "올해 Swift 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "cpp",
  "label": "C++ 쿠키",
  "category": "언어",
  "unlock": "올해 C++ 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "csharp",
  "label": "C# 쿠키",
  "category": "언어",
  "unlock": "올해 C# 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "ruby",
  "label": "Ruby 쿠키",
  "category": "언어",
  "unlock": "올해 Ruby 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "php",
  "label": "PHP 쿠키",
  "category": "언어",
  "unlock": "올해 PHP 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "dart",
  "label": "Dart 쿠키",
  "category": "언어",
  "unlock": "올해 Dart 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "shell",
  "label": "Shell 쿠키",
  "category": "언어",
  "unlock": "올해 Shell 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "haskell",
  "label": "Haskell 쿠키",
  "category": "언어",
  "unlock": "올해 Haskell 저장소에 커밋 50개",
  "data": "now"
 },
 {
  "id": "grass",
  "label": "잔디 쿠키",
  "category": "밈",
  "unlock": "올해 기여 365개",
  "data": "now"
 },
 {
  "id": "lgtm",
  "label": "LGTM 쿠키",
  "category": "밈",
  "unlock": "리뷰 승인 30개",
  "data": "api"
 },
 {
  "id": "star",
  "label": "스타 쿠키",
  "category": "밈",
  "unlock": "내 저장소 별 10개",
  "data": "api"
 },
 {
  "id": "fork",
  "label": "포크 쿠키",
  "category": "밈",
  "unlock": "저장소 포크 5번",
  "data": "events"
 },
 {
  "id": "hotfix",
  "label": "핫픽스 쿠키",
  "category": "밈",
  "unlock": "커밋 메시지에 fix 10번",
  "data": "events"
 },
 {
  "id": "404",
  "label": "404 쿠키",
  "category": "밈",
  "unlock": "만우절(4월 1일)에 기여",
  "data": "now"
 },
 {
  "id": "null",
  "label": "null 쿠키",
  "category": "밈",
  "unlock": "운세 일기에 빈 날 30일",
  "data": "site"
 },
 {
  "id": "duck",
  "label": "고무오리 쿠키",
  "category": "밈",
  "unlock": "이슈 댓글 50개",
  "data": "api"
 },
 {
  "id": "infinite",
  "label": "무한루프 쿠키",
  "category": "밈",
  "unlock": "연속 기록 100일",
  "data": "site"
 },
 {
  "id": "semicolon",
  "label": "세미콜론 쿠키",
  "category": "밈",
  "unlock": "올해 기여 1,000개",
  "data": "now"
 },
 {
  "id": "stackoverflow",
  "label": "스택오버플로우 쿠키",
  "category": "밈",
  "unlock": "하루에 기여 20개",
  "data": "now"
 },
 {
  "id": "legacy",
  "label": "레거시 쿠키",
  "category": "밈",
  "unlock": "만든 지 1년 넘은 저장소에 커밋",
  "data": "api"
 },
 {
  "id": "darkmode",
  "label": "다크모드 쿠키",
  "category": "밈",
  "unlock": "밤 10시 이후 활동 30번",
  "data": "events"
 },
 {
  "id": "keycap",
  "label": "키캡 쿠키",
  "category": "밈",
  "unlock": "한 달 동안 매일 기여",
  "data": "now"
 },
 {
  "id": "friday",
  "label": "금요일 배포 쿠키",
  "category": "밈",
  "unlock": "금요일 저녁 6시 이후 push",
  "data": "events"
 },
 {
  "id": "docker",
  "label": "도커 쿠키",
  "category": "밈",
  "unlock": "Dockerfile 있는 저장소에 커밋",
  "data": "api"
 },
 {
  "id": "galaxy",
  "label": "은하수 쿠키",
  "category": "밈",
  "unlock": "전설 운세를 받은 날",
  "data": "site"
 },
 {
  "id": "bug",
  "label": "버그 쿠키",
  "category": "밈",
  "unlock": "이슈 10개 닫기",
  "data": "api"
 },
 {
  "id": "retro",
  "label": "레트로 쿠키",
  "category": "특별",
  "unlock": "위젯을 1년 달아 두기",
  "data": "site"
 },
 {
  "id": "helloworld",
  "label": "Hello World 쿠키",
  "category": "특별",
  "unlock": "새 저장소 만들기",
  "data": "now"
 },
 {
  "id": "gacha-strawberry",
  "label": "딸기 쿠키",
  "category": "뽑기",
  "rarity": "일반",
  "unlock": "쿠키 뽑기 (일반)",
  "data": "gacha"
 },
 {
  "id": "gacha-lemon",
  "label": "레몬 쿠키",
  "category": "뽑기",
  "rarity": "일반",
  "unlock": "쿠키 뽑기 (일반)",
  "data": "gacha"
 },
 {
  "id": "gacha-blueberry",
  "label": "블루베리 쿠키",
  "category": "뽑기",
  "rarity": "일반",
  "unlock": "쿠키 뽑기 (일반)",
  "data": "gacha"
 },
 {
  "id": "gacha-mintchip",
  "label": "민트칩 쿠키",
  "category": "뽑기",
  "rarity": "일반",
  "unlock": "쿠키 뽑기 (일반)",
  "data": "gacha"
 },
 {
  "id": "gacha-vanilla",
  "label": "바닐라 쿠키",
  "category": "뽑기",
  "rarity": "일반",
  "unlock": "쿠키 뽑기 (일반)",
  "data": "gacha"
 },
 {
  "id": "gacha-sprinkle",
  "label": "스프링클 쿠키",
  "category": "뽑기",
  "rarity": "레어",
  "unlock": "쿠키 뽑기 (레어)",
  "data": "gacha"
 },
 {
  "id": "gacha-macaron",
  "label": "마카롱 쿠키",
  "category": "뽑기",
  "rarity": "레어",
  "unlock": "쿠키 뽑기 (레어)",
  "data": "gacha"
 },
 {
  "id": "gacha-donut",
  "label": "도넛 쿠키",
  "category": "뽑기",
  "rarity": "레어",
  "unlock": "쿠키 뽑기 (레어)",
  "data": "gacha"
 },
 {
  "id": "burnt",
  "label": "탄 쿠키",
  "category": "뽑기",
  "rarity": "레어",
  "unlock": "쿠키 뽑기 (레어)",
  "data": "gacha"
 },
 {
  "id": "rainbow",
  "label": "무지개 쿠키",
  "category": "뽑기",
  "rarity": "에픽",
  "unlock": "쿠키 뽑기 (에픽)",
  "data": "gacha"
 },
 {
  "id": "gacha-crystal",
  "label": "크리스탈 쿠키",
  "category": "뽑기",
  "rarity": "에픽",
  "unlock": "쿠키 뽑기 (에픽)",
  "data": "gacha"
 },
 {
  "id": "gacha-crown",
  "label": "왕관 쿠키",
  "category": "뽑기",
  "rarity": "전설",
  "unlock": "쿠키 뽑기 (전설)",
  "data": "gacha"
 }
];

export const GACHA = {
 "ticket_price": 150,
 "ten_pack_price": 1350,
 "odds": {
  "일반": 0.6,
  "레어": 0.28,
  "에픽": 0.1,
  "전설": 0.02
 },
 "crumbs_on_duplicate": {
  "일반": 1,
  "레어": 3,
  "에픽": 8,
  "전설": 20
 },
 "exchange_cost": {
  "일반": 10,
  "레어": 30,
  "에픽": 80,
  "전설": 200
 }
};

export const ITEMS = {
 "freeze": {
  "label": "냉동 쿠키",
  "price": 200,
  "max": 2
 },
 "gacha_ticket": {
  "label": "쿠키 뽑기권",
  "price": 150
 },
 "ai_fortune": {
  "label": "AI 점쟁이 이용권",
  "price": 1000
 }
};

