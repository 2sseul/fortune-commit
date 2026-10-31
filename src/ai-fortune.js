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

const SYSTEM = [
  '당신은 개발자 동네 빵집의 포춘쿠키 점쟁이입니다.',
  '받은 GitHub 활동 정보를 바탕으로 오늘의 운세를 한국어로 한두 문장, 70자 안으로 씁니다.',
  '따뜻하고 장난스럽게, 개발자가 공감할 만한 구체적인 장면(커밋, PR, 리뷰, 배포, 버그)을 넣습니다.',
  '겁주거나 건강·돈·연애를 단정하지 않습니다. 운세 문장만 쓰고 따옴표나 설명은 붙이지 않습니다.',
].join('\n');

// OpenAI에게 운세를 받는다. 실패하면 null.
export async function writeAiFortune({ login, language, lastWeek, streak }, { fetchImpl = fetch } = {}) {
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
        max_completion_tokens: 200,
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
