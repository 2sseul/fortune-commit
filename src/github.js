// GitHub에서 위젯 주인의 활동을 가져오는 모듈
//   today    : 오늘(기준 시간대 0시 ~ 지금) 활동 수 → 커밋하고 열기 (0이면 잠김)
//   lastWeek : 지난 7일(어제까지) 기여 수 → 활동 맞춤 운세 (하루 동안 바뀌지 않게 오늘은 뺀다)
//   language : 최근 손댄 공개 저장소들에서 가장 많이 쓴 언어 → 언어 운세
//
// 왜 today만 다른 방법으로 세나요?
//   GitHub 기여(잔디)는 한국 시간이 아니라 UTC 날짜로 기록된다. 그래서 기여로 세면 한국 0시~9시에는
//   어제 저녁 기여가 '오늘'로 잡혀 쿠키가 잠기지 않는다. 그래서 오늘 활동은 초 단위 시각이 기록되는
//   GitHub 공개 이벤트(push, PR, 이슈, 리뷰, 새 저장소)로 한국 0시부터 정확히 센다.
//   (공개 이벤트만 보이므로 비공개 저장소 활동으로는 열리지 않는다)
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
  query ($login: String!, $todayFrom: DateTime!, $weekFrom: DateTime!) {
    user(login: $login) {
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

// 오늘 활동으로 셀 GitHub 이벤트인지 판단하고, 몇 개로 셀지 돌려준다.
//   push(커밋 수만큼), PR 열기, 이슈 열기, 코드 리뷰, 새 저장소 만들기
function eventWeight(event) {
  const { type, payload = {} } = event;
  if (type === 'PushEvent') return Math.max(1, Number(payload.size) || 0);
  if (type === 'PullRequestEvent' || type === 'IssuesEvent') return payload.action === 'opened' ? 1 : 0;
  if (type === 'PullRequestReviewEvent') return 1;
  if (type === 'CreateEvent') return payload.ref_type === 'repository' ? 1 : 0;
  return 0;
}

// 기준 시간대의 오늘 0시(since)부터 지금까지의 공개 활동 수를 센다. 확인할 수 없으면 null.
export async function countTodayEvents({ login, token, since, fetchImpl = fetch }) {
  try {
    const response = await fetchImpl(`https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'fortune-commit',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const events = await response.json();
    if (!Array.isArray(events)) return null;
    return events
      .filter((event) => Date.parse(event.created_at) >= since.getTime())
      .reduce((total, event) => total + eventWeight(event), 0);
  } catch {
    return null;
  }
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
    // 오늘 활동(이벤트)과 지난 7일·주 언어(GraphQL)를 동시에 물어본다.
    const todayRequest = countTodayEvents({ login, token, since: todayFrom, fetchImpl });
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
          weekFrom: new Date(todayFrom.getTime() - 7 * DAY_MS).toISOString(),
        },
      }),
      signal: AbortSignal.timeout(3000), // 3초 안에 답이 없으면 포기하고 기본 운세를 보여준다.
    });
    if (!response.ok) return null;

    const body = await response.json();
    const user = body?.data?.user;
    if (!user?.lastWeek) return null; // 없는 아이디 등

    const activity = {
      today: await todayRequest, // 이벤트를 확인할 수 없으면 null → 잠그지 않는다
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

// ---------------------------------------------------------------------------
// v2: 스킨 해금에 쓰는 "올해 활동"
//   total     : 올해 기여 수 (잔디 수)
//   commits   : 올해 커밋 수, prs: 올해 PR 수, reviews: 올해 코드 리뷰 수
//   streak    : 올해 가장 길게 이어진 연속 기여 일수
//   months    : 월별 기여 수 { 1: 3, 10: 12, ... }
//   days      : 날짜별 기여 수 { '2026-12-25': 2, ... }
// 날짜별 기여는 GitHub 잔디(contributionCalendar)의 날짜를 그대로 쓴다.

const YEAR_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }`;

const yearMemory = new Map();
const YEAR_MEMORY_MS = 60 * 60 * 1000; // 올해 활동은 1시간 기억 (해금은 천천히 바뀌어도 괜찮다)

// 기준 시간대의 올해 1월 1일 0시를 UTC 시각으로 구한다.
export function startOfYear(timeZone, now = new Date()) {
  const todayStart = startOfToday(timeZone, now);
  // 오늘 0시(그 시간대)와 같은 시차를 1월 1일에도 쓴다. (서머타임 차이 정도는 무시한다)
  const year = Number(new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'Asia/Seoul', year: 'numeric' }).format(now));
  const localMidnightAsUtc = Date.UTC(year, 0, 1);
  const todayLocal = new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const offset = Date.parse(`${todayLocal}T00:00:00Z`) - todayStart.getTime();
  return new Date(localMidnightAsUtc - offset);
}

// 날짜별 기여 목록으로 올해 활동을 정리한다.
export function summarizeYear(collection) {
  const days = {};
  const months = {};
  let streak = 0;
  let run = 0;
  let previous = null; // 바로 앞 날짜 (하루씩 이어지는지 확인용)
  const allDays = collection.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const { date, contributionCount } of allDays) {
    days[date] = contributionCount;
    const month = Number(date.slice(5, 7));
    months[month] = (months[month] ?? 0) + contributionCount;
    // 기여가 있고 바로 전날에 이어지는 날이면 연속 기록을 늘리고, 아니면 다시 센다.
    const isNextDay = previous !== null && Date.parse(date) - Date.parse(previous) === DAY_MS;
    if (contributionCount === 0) run = 0;
    else run = isNextDay ? run + 1 : 1;
    streak = Math.max(streak, run);
    previous = date;
  }
  return {
    total: collection.contributionCalendar.totalContributions,
    commits: collection.totalCommitContributions,
    prs: collection.totalPullRequestContributions,
    reviews: collection.totalPullRequestReviewContributions,
    streak,
    months,
    days,
  };
}

// 위젯 주인의 올해 활동을 돌려준다. 확인할 수 없으면 null.
export async function fetchYearActivity({
  login,
  timeZone,
  date,
  token = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
  now = new Date(),
}) {
  if (!login || !token) return null;

  const key = `${login}|${date}`;
  const remembered = yearMemory.get(key);
  if (remembered && remembered.expiresAt > now.getTime()) return remembered.year;

  try {
    const response = await fetchImpl(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'fortune-commit',
      },
      body: JSON.stringify({
        query: YEAR_QUERY,
        variables: { login, from: startOfYear(timeZone, now).toISOString(), to: now.toISOString() },
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;

    const body = await response.json();
    const collection = body?.data?.user?.contributionsCollection;
    if (!collection?.contributionCalendar) return null;

    const year = summarizeYear(collection);
    yearMemory.set(key, { year, expiresAt: now.getTime() + YEAR_MEMORY_MS });
    return year;
  } catch {
    return null;
  }
}

// 테스트에서 기억해 둔 올해 활동을 지울 때 쓴다.
export function clearYearMemory() {
  yearMemory.clear();
}
