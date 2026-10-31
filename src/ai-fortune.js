// AI 점쟁이 (v3.3)
// 상점에서 이용권(1,000P)을 사면 Claude가 그날의 운세를 써 준다. 그날 위젯·사이트·일기에 나온다.
//   - 공개 정보만 쓴다: 아이디, 주 언어, 지난 7일 기여 수, 연속 기록 (비공개 저장소 내용은 보내지 않는다)
//   - 하루에 한 사람 한 번, 사이트 전체로는 하루 AI_DAILY_LIMIT번까지 (비용 상한)
//   - 실패하면 포인트를 돌려준다.
// API 키는 Vercel 환경변수 ANTHROPIC_API_KEY. 키가 없으면 '준비 중'으로 답한다. (개발 서버에서는 예시 문구)

import Anthropic from '@anthropic-ai/sdk';
import { spendPoints, refundPoints, getAiFortune, saveAiFortune, takeAiSlot, releaseAiSlot } from './store.js';

export const AI_DAILY_LIMIT = 200;
const MODEL = 'claude-opus-5-5';

const SYSTEM = [
  '당신은 개발자 동네 빵집의 포춘쿠키 점쟁이입니다.',
  '받은 GitHub 활동 정보를 바탕으로 오늘의 운세를 한국어로 한두 문장, 70자 안으로 씁니다.',
  '따뜻하고 장난스럽게, 개발자가 공감할 만한 구체적인 장면(커밋, PR, 리뷰, 배포, 버그)을 넣습니다.',
  '겁주거나 건강·돈·연애를 단정하지 않습니다. 운세 문장만 쓰고 따옴표나 설명은 붙이지 않습니다.',
].join('\n');

// Claude에게 운세를 받는다. 실패하면 null.
export async function writeAiFortune({ login, language, lastWeek, streak }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return process.env.FC_DEV === '1' ? `(개발용 예시) ${language ?? '코드'} 쪽에서 반가운 리뷰가 도착할 거예요.` : null;
  }
  try {
    const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low' }, // 짧은 문장이라 깊게 생각할 필요가 없다
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // 안전 분류기가 거절하면 서버가 다른 모델로 다시 써 준다
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `아이디: ${login}\n주 언어: ${language ?? '알 수 없음'}\n지난 7일 기여: ${lastWeek ?? 0}개\n연속 기록: ${streak}일`,
      }],
    });
    if (response.stop_reason === 'refusal') return null;
    const text = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('').trim();
    return text ? text.slice(0, 120) : null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`AI 점쟁이 오류 ${error.status}: ${error.message}`);
    else console.error('AI 점쟁이 연결 실패:', error?.message);
    return null;
  }
}

// 이용권 사기 = 포인트를 쓰고 바로 운세를 받는다.
// → { result: 'ok' | 'done' | 'busy' | 'poor' | 'failed' | 'off' | null, fortune }
export async function buyAiFortune(login, { year, date, price, earned, account }) {
  if (!process.env.ANTHROPIC_API_KEY && process.env.FC_DEV !== '1') return { result: 'off' };
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
