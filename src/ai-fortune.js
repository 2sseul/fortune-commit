// AI 점쟁이 (v3.3)
// 상점에서 이용권(1,000P)을 사면 OpenAI 모델이 그날의 운세를 써 준다. 그날 위젯·사이트·일기에 나온다.
//   - 공개 정보만 쓴다: 아이디, 주 언어, 지난 7일 기여 수, 연속 기록 (비공개 저장소 내용은 보내지 않는다)
//   - 하루에 한 사람 한 번, 사이트 전체로는 하루 AI_DAILY_LIMIT번까지 (비용 상한)
//   - 실패하면 포인트를 돌려준다.
// API 키는 Vercel 환경변수 OPENAI_API_KEY. 키가 없으면 '준비 중'으로 답한다. (개발 서버에서는 예시 문구)
// 모델은 OPENAI_MODEL로 바꿀 수 있다. (기본 gpt-4o-mini: 짧은 한두 문장이라 작은 모델로 충분하고 저렴하다)
// 패키지 없이 Node 기본 fetch로 Chat Completions API를 부른다.

import { spendPoints, refundPoints, getAiFortune, saveAiFortune, takeAiSlot, releaseAiSlot } from './store.js';

export const AI_DAILY_LIMIT = 200;
const API_URL = 'https://api.openai.com/v1/chat/completions';
const model = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

// 말투는 다른 운세와 같게 (.claude/skills/fortune-writer 규칙): '오늘 ~할 거예요'로 오늘 일을 점치는 한 문장
const SYSTEM = [
  '당신은 개발자 동네 빵집의 포춘쿠키 점쟁이입니다. 받은 GitHub 활동 정보를 보고 오늘의 운세 한 줄을 씁니다.',
  '규칙:',
  '- 한국어, 오늘 일어날 일을 점치는 문장. "~할 거예요" "~예요"처럼 자연스러운 존댓말로 끝냅니다.',
  '- "~합니다" "~입니다" 같은 딱딱한 말투, "~하세요" "~만드세요" 같은 명령·권유는 쓰지 않습니다.',
  '- 한 문장이 기본이고, 길어도 짧은 한마디를 덧붙인 두 문장까지. 전체 45자 안팎, 60자를 넘지 않습니다.',
  '- 개발자라면 아는 장면(PR, 머지 충돌, CI, 리뷰, 배포, 세미콜론, 고무 오리, Stack Overflow)으로 웃깁니다. 사주·귀인 같은 운세 말투를 섞어도 좋아요.',
  '- 활동 정보(언어, 기여 수, 연속 기록)는 자연스럽게 녹이되 숫자를 그대로 나열하지 않습니다. "기여가 많아서" 같은 설명은 하지 말고 장면으로 보여 줍니다.',
  '- 구체적인 장면 하나를 꼭 넣고, 끝에 짧은 한마디로 웃기면 더 좋습니다. "오늘은 ~한 날이에요" 같은 뻔한 시작은 피합니다.',
  '- 겁주거나 건강·돈·연애·외모·정치를 말하지 않고, 특정 언어나 사람을 깎아내리지 않습니다.',
  '- 운세 문장만 씁니다. 따옴표, 설명, 이모지는 붙이지 않습니다.',
  '예시:',
  '동쪽에서 귀인이 나타나 PR을 승인해 줄 거예요.',
  '오늘 푸시한 코드는 한 번에 빌드될 거예요. 본인도 놀랄 만큼요.',
  '오늘 사주에 \'머지 충돌 없음\'이 보여요. 마음 편히 머지해도 될 거예요.',
  '오늘 찾는 버그는 세미콜론 하나일 거예요. 5분이면 끝나요.',
].join('\n');

// 말투·길이가 규칙에 맞는지 (안 맞으면 한 번 더 쓰게 한다)
export function fitsStyle(text) {
  if (!text || text.length > 60) return false;
  if (/(합니다|입니다|하세요|드세요|세요)[.!]?$/.test(text)) return false;
  return /요[.!]?$/.test(text);
}

// OpenAI에게 운세를 받는다. 실패하면 null.
async function askOnce({ login, language, lastWeek, streak }, { fetchImpl = fetch } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return process.env.FC_DEV === '1' ? `(개발용 예시) ${language ?? '코드'} 쪽에서 반가운 리뷰가 도착할 거예요.` : null;
  }
  try {
    const response = await fetchImpl(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model(),
        max_completion_tokens: 120,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `아이디: ${login}\n주 언어: ${language ?? '알 수 없음'}\n지난 7일 기여: ${lastWeek ?? 0}개\n연속 기록: ${streak}일` },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      // 키가 틀렸거나(401), 사용 한도(429), OpenAI 서버 문제(5xx). 오류 내용에 키는 들어 있지 않다.
      const detail = await response.json().catch(() => ({}));
      console.error(`AI 점쟁이 오류 ${response.status}: ${detail?.error?.message ?? ''}`);
      return null;
    }
    const body = await response.json();
    const choice = body?.choices?.[0];
    if (!choice || choice.message?.refusal) return null; // 모델이 거절한 경우
    const text = (choice.message?.content ?? '').trim().replace(/^["'“”]+|["'“”]+$/g, '');
    return text ? text.slice(0, 120) : null;
  } catch (error) {
    console.error('AI 점쟁이 연결 실패:', error?.message);
    return null;
  }
}

// OpenAI에게 운세를 받는다. 말투가 어긋나면 한 번 더 쓰게 하고, 그래도 어긋나면 두 번째 것을 쓴다. 실패하면 null.
export async function writeAiFortune(info, options = {}) {
  const first = await askOnce(info, options);
  if (!first || fitsStyle(first) || !process.env.OPENAI_API_KEY) return first;
  return (await askOnce(info, options)) ?? first;
}

// 이용권 사기 = 포인트를 쓰고 바로 운세를 받는다.
// → { result: 'ok' | 'done' | 'busy' | 'poor' | 'failed' | 'off' | null, fortune }
export async function buyAiFortune(login, { year, date, price, earned, account }) {
  if (!process.env.OPENAI_API_KEY && process.env.FC_DEV !== '1') return { result: 'off' };
  if (await getAiFortune(login, date)) return { result: 'done' };
  if (!(await takeAiSlot(date, AI_DAILY_LIMIT))) return { result: 'busy' };
  const paid = await spendPoints(login, { year, price, earned });
  if (paid !== 'ok') {
    await releaseAiSlot(date);
    return { result: paid };
  }
  const fortune = await writeAiFortune({
    login, language: account.activity?.language, lastWeek: account.activity?.lastWeek, streak: account.daily.streak,
  });
  if (!fortune || !(await saveAiFortune(login, date, fortune))) {
    await refundPoints(login, { year, price });
    await releaseAiSlot(date);
    return { result: 'failed' };
  }
  return { result: 'ok', fortune };
}
