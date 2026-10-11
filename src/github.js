// GitHub에서 "오늘 기여 수"를 가져오는 모듈 (커밋하고 열기 기능에 쓴다)
// 기여 = 커밋, PR, 이슈, 코드 리뷰, 새 저장소 만들기 + 비공개 기여(프로필에서 공개를 켠 경우)
//
// GitHub GraphQL API는 토큰이 있어야 쓸 수 있다. 토큰은 Vercel 환경변수 GITHUB_TOKEN에 넣는다.
// 확인에 실패하면 null을 돌려주고, 위젯은 이 경우 운세를 그대로 보여준다. (위젯이 깨지지 않게)

import { secondsUntilMidnight } from './pick.js';

const GRAPHQL_URL = 'https://api.github.com/graphql';

const QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
      }
    }
  }`;

// 서버 안에서 잠깐 기억해 두는 결과 (같은 사람을 여러 번 물어보지 않게)
// 열쇠: '아이디|날짜', 값: { count, expiresAt }
const memory = new Map();
const LOCKED_MEMORY_MS = 60 * 1000; // 기여 0개라는 결과는 1분만 기억 (커밋하면 금방 열리도록)
const OPEN_MEMORY_MS = 60 * 60 * 1000; // 기여가 있다는 결과는 1시간 기억 (그날은 다시 0이 될 일이 없음)

// 기준 시간대의 "오늘 0시"를 UTC 시각으로 구한다.
export function startOfToday(timeZone, now = new Date()) {
  const passedSeconds = 24 * 3600 - secondsUntilMidnight(timeZone, now);
  return new Date(now.getTime() - passedSeconds * 1000);
}

// GraphQL 응답에서 기여 수를 모두 더한다.
function sumContributions(collection) {
  return Object.values(collection).reduce((total, n) => total + (Number(n) || 0), 0);
}

// 오늘 기여 수를 돌려준다. 확인할 수 없으면 null.
// fetchImpl, now는 테스트에서 가짜 값을 넣으려고 받는 값이다.
export async function countTodayContributions({
  login,
  timeZone,
  date,
  token = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
  now = new Date(),
}) {
  if (!login || !token) return null; // 아이디나 토큰이 없으면 확인할 수 없다.

  const key = `${login}|${date}`;
  const remembered = memory.get(key);
  if (remembered && remembered.expiresAt > now.getTime()) return remembered.count;

  try {
    const response = await fetchImpl(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'fortune-commit',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          login,
          from: startOfToday(timeZone, now).toISOString(),
          to: now.toISOString(),
        },
      }),
      signal: AbortSignal.timeout(3000), // 3초 안에 답이 없으면 포기하고 운세를 보여준다.
    });
    if (!response.ok) return null;

    const body = await response.json();
    const collection = body?.data?.user?.contributionsCollection;
    if (!collection) return null; // 없는 아이디 등

    const count = sumContributions(collection);
    memory.set(key, {
      count,
      expiresAt: now.getTime() + (count > 0 ? OPEN_MEMORY_MS : LOCKED_MEMORY_MS),
    });
    return count;
  } catch {
    return null; // 네트워크 오류, 시간 초과 등
  }
}

// 테스트에서 기억해 둔 결과를 지울 때 쓴다.
export function clearContributionMemory() {
  memory.clear();
}
