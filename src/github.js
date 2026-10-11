// GitHub에서 위젯 주인의 활동을 가져오는 모듈
//   today    : 오늘(기준 시간대 0시 ~ 지금) 기여 수 → 커밋하고 열기 (0이면 잠김)
//   lastWeek : 지난 7일(어제까지) 기여 수 → 활동 맞춤 운세 (하루 동안 바뀌지 않게 오늘은 뺀다)
//   language : 최근 손댄 공개 저장소들에서 가장 많이 쓴 언어 → 언어 운세
// 기여 = 커밋, PR, 이슈, 코드 리뷰, 새 저장소 만들기 + 비공개 기여(프로필에서 공개를 켠 경우)
//
// GitHub GraphQL API는 토큰이 있어야 쓸 수 있다. 토큰은 Vercel 환경변수 GITHUB_TOKEN에 넣는다.
// 확인에 실패하면 null을 돌려주고, 위젯은 이 경우 잠그지 않고 기본 운세를 보여준다. (위젯이 깨지지 않게)

import { secondsUntilMidnight } from './pick.js';

const GRAPHQL_URL = 'https://api.github.com/graphql';
const DAY_MS = 24 * 60 * 60 * 1000;

// 기여 수를 세는 항목들 (오늘, 지난 7일에 똑같이 쓴다)
const CONTRIBUTION_FIELDS = `
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount`;

const QUERY = `
  query ($login: String!, $todayFrom: DateTime!, $now: DateTime!, $weekFrom: DateTime!) {
    user(login: $login) {
      today: contributionsCollection(from: $todayFrom, to: $now) {${CONTRIBUTION_FIELDS}
      }
      lastWeek: contributionsCollection(from: $weekFrom, to: $todayFrom) {${CONTRIBUTION_FIELDS}
      }
      repositories(first: 30, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC,
                   orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes { primaryLanguage { name } }
      }
    }
  }`;

// 서버 안에서 잠깐 기억해 두는 결과 (같은 사람을 여러 번 물어보지 않게)
// 열쇠: '아이디|날짜', 값: { activity, expiresAt }
const memory = new Map();
const LOCKED_MEMORY_MS = 60 * 1000; // 오늘 기여 0개라는 결과는 1분만 기억 (커밋하면 금방 열리도록)
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

// 저장소들의 주 언어 중 가장 많이 나온 것을 고른다. (같으면 최근에 손댄 저장소의 언어)
export function mostUsedLanguage(repositories) {
  const counts = new Map();
  for (const repo of repositories ?? []) {
    const name = repo?.primaryLanguage?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = null;
  for (const [name, count] of counts) {
    if (best === null || count > counts.get(best)) best = name; // Map은 넣은 순서(최근 순)를 지킨다.
  }
  return best;
}

// 위젯 주인의 활동을 돌려준다. 확인할 수 없으면 null.
// 돌려주는 값: { today, lastWeek, language }
// fetchImpl, now는 테스트에서 가짜 값을 넣으려고 받는 값이다.
export async function fetchActivity({
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
  if (remembered && remembered.expiresAt > now.getTime()) return remembered.activity;

  const todayFrom = startOfToday(timeZone, now);
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
          todayFrom: todayFrom.toISOString(),
          now: now.toISOString(),
          weekFrom: new Date(todayFrom.getTime() - 7 * DAY_MS).toISOString(),
        },
      }),
      signal: AbortSignal.timeout(3000), // 3초 안에 답이 없으면 포기하고 기본 운세를 보여준다.
    });
    if (!response.ok) return null;

    const body = await response.json();
    const user = body?.data?.user;
    if (!user?.today || !user?.lastWeek) return null; // 없는 아이디 등

    const activity = {
      today: sumContributions(user.today),
      lastWeek: sumContributions(user.lastWeek),
      language: mostUsedLanguage(user.repositories?.nodes),
    };
    memory.set(key, {
      activity,
      expiresAt: now.getTime() + (activity.today > 0 ? OPEN_MEMORY_MS : LOCKED_MEMORY_MS),
    });
    return activity;
  } catch {
    return null; // 네트워크 오류, 시간 초과 등
  }
}

// 테스트에서 기억해 둔 결과를 지울 때 쓴다.
export function clearActivityMemory() {
  memory.clear();
}
