// GitHub에서 위젯 주인의 활동을 가져오는 모듈
//   today    : 오늘(기준 시간대 0시 ~ 지금) 활동 수 → 커밋하고 열기 (0이면 잠김)
//   lastWeek : 지난 7일(어제까지) 기여 수 → 활동 맞춤 운세 (하루 동안 바뀌지 않게 오늘은 뺀다)
//   language : 최근 손댄 공개 저장소들에서 가장 많이 쓴 언어 → 언어 운세
//
// 왜 today만 다른 방법으로 세나요?
//   GitHub 기여(잔디)는 한국 시간이 아니라 UTC 날짜로 기록된다. 그래서 기여로 세면 한국 0시~9시에는
//   어제 저녁 기여가 '오늘'로 잡혀 쿠키가 잠기지 않는다. 그래서 오늘 활동은 초 단위 시각이 기록되는
//   GitHub 공개 이벤트(push, PR, 이슈, 리뷰, 새 저장소)로 한국 0시부터 정확히 센다.
//   단, 이벤트 목록은 늦게는 몇 시간 뒤에 반영되기도 해서, 내 공개 저장소의 '마지막 push 시각'(즉시 반영)도
//   함께 본다. 둘 중 하나라도 오늘이면 쿠키가 열린다.
//   (공개 활동만 보이므로 비공개 저장소 활동으로는 열리지 않는다)
//
// GitHub GraphQL API는 토큰이 있어야 쓸 수 있다. 토큰은 Vercel 환경변수 GITHUB_TOKEN에 넣는다.
// 확인에 실패하면 null을 돌려주고, 위젯은 이 경우 잠그지 않고 기본 운세를 보여준다. (위젯이 깨지지 않게)

import { secondsUntilMidnight, todayIn } from './pick.js';
import { devActivity, devYear } from './dev-fixtures.js';
import { cacheGet, cacheSet } from './store.js';

// 로컬 개발 서버(FC_DEV=1)에서 토큰이 없으면 가짜 활동을 쓴다. (화면 확인용)
const useDevData = (token) => !token && process.env.FC_DEV === '1';

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
        nodes { primaryLanguage { name } pushedAt }
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
// GitHub가 붙인 언어 이름을 쿠키·운세에서 쓰는 이름으로 맞춘다. (v3)
//   노트북은 Python, Vue·Svelte는 JavaScript로 센다. HTML·CSS 같은 마크업·문서는 '쓴 언어'로 세지 않는다.
const LANGUAGE_ALIAS = { 'Jupyter Notebook': 'Python', Vue: 'JavaScript', Svelte: 'JavaScript' };
const NOT_LANGUAGES = new Set(['HTML', 'CSS', 'SCSS', 'Sass', 'Less', 'Markdown', 'MDX', 'TeX', 'Dockerfile', 'Makefile']);
export function normalizeLanguage(name) {
  if (!name || NOT_LANGUAGES.has(name)) return null;
  return LANGUAGE_ALIAS[name] ?? name;
}

// 저장소 목록(최근 push한 순)에서 가장 많이 쓴 언어. 같으면 더 최근에 쓴 언어.
export function mostUsedLanguage(repositories) {
  const counts = new Map();
  for (const repo of repositories ?? []) {
    const name = normalizeLanguage(repo?.primaryLanguage?.name);
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
  if (login && useDevData(token)) return devActivity(date);
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

    // 오늘 활동 = 이벤트 수, 그리고 내 공개 저장소에 오늘 push했다면 최소 1
    const events = await todayRequest; // 이벤트를 확인할 수 없으면 null
    const pushedToday = (user.repositories?.nodes ?? [])
      .some((repo) => repo?.pushedAt && Date.parse(repo.pushedAt) >= todayFrom.getTime());
    let today = events;
    if (pushedToday) today = Math.max(events ?? 0, 1);

    const activity = {
      today, // 둘 다 확인할 수 없으면 null → 잠그지 않는다
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
// v2: 스킨 해금에 쓰는 "올해 활동" (v3에서 쿠키 65종에 맞게 늘림)
//   total     : 올해 기여 수 (잔디 수)
//   commits   : 올해 커밋 수, prs: 올해 PR 수, reviews: 올해 코드 리뷰 수
//   streak    : 올해 가장 길게 이어진 연속 기여 일수
//   months    : 월별 기여 수 { 1: 3, 10: 12, ... }
//   days      : 날짜별 기여 수 { '2026-12-25': 2, ... }
//   (v3) language   : 내 공개 저장소에서 가장 많이 쓴 언어
//        merged     : 올해 머지된 내 PR 수 (최근 100개 중), approvals: 올해 승인한 리뷰 수 (최근 100개 중)
//        stars      : 내 공개 저장소 별 합계, forks: 올해 포크한 저장소 수, newRepos: 올해 만든 저장소 수
//        legacy     : 만든 지 1년 넘었는데 올해 push한 저장소 수, docker: Dockerfile이 있고 올해 push한 저장소 수
//        issueComments : 이슈 댓글 수 (전체), closedIssues : 내가 연 이슈 중 닫힌 것 (전체)
//        late / night / friday / fixes : 올해 커밋 중 새벽(0~5시)·밤(22시~)·금요일 저녁(18시~) 커밋 수, 메시지에 fix가 들어간 커밋 수
//          (최근 push한 저장소 30개에서 저장소마다 최근 커밋 40개를 본다. 한 번 해금하면 기록되므로 표본으로 충분하다)
// 날짜별 기여는 GitHub 잔디(contributionCalendar)의 날짜를 그대로 쓴다.

const YEAR_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!, $since: GitTimestamp!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
        pullRequestContributions(first: 100) { nodes { pullRequest { merged } } }
        pullRequestReviewContributions(first: 100) { nodes { pullRequestReview { state } } }
      }
      issueComments { totalCount }
      closedIssues: issues(states: CLOSED) { totalCount }
      repositories(first: 30, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          isFork createdAt pushedAt stargazerCount
          primaryLanguage { name }
          dockerfile: object(expression: "HEAD:Dockerfile") { id }
          defaultBranchRef { target { ... on Commit {
            history(first: 40, since: $since) { nodes { committedDate message author { user { login } } } }
          } } }
        }
      }
    }
  }`;

// v2의 기본 질의 (기여 달력·커밋·PR·리뷰만). v3 질의가 실패하면 이걸로 다시 물어서, 예전 쿠키 해금은 언제나 계산되게 한다.
const BASIC_YEAR_QUERY = `
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

// 그 시간대의 요일(0=일요일)과 시(0~23)
function localTime(iso, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timeZone || 'Asia/Seoul', weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((p) => p.type === 'weekday').value);
  return { weekday, hour: Number(parts.find((p) => p.type === 'hour').value) % 24 };
}

// 저장소·커밋 정보로 v3 쿠키에 쓰는 숫자를 센다. (user가 없으면 모두 0)
export function summarizeExtras(user, { login, from, timeZone } = {}) {
  const repos = user?.repositories?.nodes?.filter(Boolean) ?? [];
  const own = repos.filter((repo) => !repo.isFork);
  const yearStart = from ? Date.parse(from) : 0;
  const thisYear = (iso) => Boolean(iso) && Date.parse(iso) >= yearStart;
  const collection = user?.contributionsCollection;
  const extras = {
    // 주 언어는 올해 push한 저장소로 센다 ('올해 기여 100'과 같은 기간). 올해 push한 저장소가 없으면 전부로
    language: mostUsedLanguage(own.some((repo) => thisYear(repo.pushedAt)) ? own.filter((repo) => thisYear(repo.pushedAt)) : own),
    merged: (collection?.pullRequestContributions?.nodes ?? []).filter((n) => n?.pullRequest?.merged).length,
    approvals: (collection?.pullRequestReviewContributions?.nodes ?? []).filter((n) => n?.pullRequestReview?.state === 'APPROVED').length,
    stars: own.reduce((sum, repo) => sum + (repo.stargazerCount ?? 0), 0),
    forks: repos.filter((repo) => repo.isFork && thisYear(repo.createdAt)).length,
    newRepos: own.filter((repo) => thisYear(repo.createdAt)).length,
    legacy: own.filter((repo) => thisYear(repo.pushedAt) && Date.parse(repo.pushedAt) - Date.parse(repo.createdAt) > 365 * DAY_MS).length,
    docker: own.filter((repo) => repo.dockerfile && thisYear(repo.pushedAt)).length,
    issueComments: user?.issueComments?.totalCount ?? 0,
    closedIssues: user?.closedIssues?.totalCount ?? 0,
    late: 0,
    night: 0,
    friday: 0,
    fixes: 0,
  };
  const me = (login ?? '').toLowerCase();
  for (const repo of repos) {
    for (const commit of repo.defaultBranchRef?.target?.history?.nodes ?? []) {
      if (!commit || commit.author?.user?.login?.toLowerCase() !== me || !thisYear(commit.committedDate)) continue;
      const { weekday, hour } = localTime(commit.committedDate, timeZone);
      if (hour < 5) extras.late += 1;
      if (hour >= 22) extras.night += 1;
      if (weekday === 5 && hour >= 18) extras.friday += 1;
      if (/fix/i.test(commit.message ?? '')) extras.fixes += 1;
    }
  }
  return extras;
}

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
  // 주말에 기여한 날, 하루 최대 기여, 하루도 빠짐없이 기여한 달 (v3)
  const active = Object.entries(days).filter(([, count]) => count > 0);
  const weekendDays = active.filter(([date]) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())).length;
  const bestDay = Math.max(0, ...active.map(([, count]) => count));
  const fullMonths = Object.keys(months).filter((month) => {
    const inMonth = Object.entries(days).filter(([date]) => Number(date.slice(5, 7)) === Number(month));
    const y = Number(inMonth[0]?.[0].slice(0, 4));
    const length = new Date(Date.UTC(y, Number(month), 0)).getUTCDate();
    return inMonth.length === length && inMonth.every(([, count]) => count > 0);
  }).length;
  return {
    total: collection.contributionCalendar.totalContributions,
    weekendDays,
    bestDay,
    fullMonths,
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
  if (login && useDevData(token)) return devYear(date ?? todayIn(timeZone, now));
  if (!login || !token) return null;

  const key = `${login}|${date}`;
  const remembered = yearMemory.get(key);
  if (remembered && remembered.expiresAt > now.getTime()) return remembered.year;
  // 다른 서버 함수가 방금 물어본 결과가 Redis에 있으면 그걸 쓴다. (GitHub 질의가 1~3초 걸려서)
  const shared = await cacheGet(`year2:${key.toLowerCase()}`);
  if (shared) {
    yearMemory.set(key, { year: shared, expiresAt: now.getTime() + 5 * 60 * 1000 });
    return shared;
  }

  const yearFrom = startOfYear(timeZone, now).toISOString();
  const variables = { login, from: yearFrom, to: now.toISOString() };
  // GraphQL 질의 하나를 보내고 user를 돌려준다. 실패하면 null. (오류 내용은 서버 기록에 남긴다)
  const ask = async (query, vars, ms) => {
    try {
      const response = await fetchImpl(GRAPHQL_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'fortune-commit' },
        body: JSON.stringify({ query, variables: vars }),
        signal: AbortSignal.timeout(ms),
      });
      if (!response.ok) return null;
      const body = await response.json();
      if (body?.errors?.length && !body?.data?.user) console.error('올해 활동 질의 오류:', body.errors.map((e) => e.message).join(' / '));
      return body?.data?.user?.contributionsCollection?.contributionCalendar ? body.data.user : null;
    } catch {
      return null;
    }
  };

  // v3 질의(저장소·커밋까지)를 먼저, 실패하면 v2 기본 질의로 다시 (예전 쿠키 해금은 언제나 계산되게)
  let user = await ask(YEAR_QUERY, { ...variables, since: yearFrom }, 6000); // v3: 저장소·커밋까지 보느라 조금 더 기다린다
  const full = Boolean(user);
  if (!user) user = await ask(BASIC_YEAR_QUERY, variables, 3000);
  if (!user) return null;

  const year = { ...summarizeYear(user.contributionsCollection), ...(full ? summarizeExtras(user, { login, from: yearFrom, timeZone }) : {}) };
  // 기본 질의로만 받았으면 짧게 기억해서 곧 다시 v3 질의를 해 본다.
  yearMemory.set(key, { year, expiresAt: now.getTime() + (full ? YEAR_MEMORY_MS : 5 * 60 * 1000) });
  await cacheSet(`year2:${key.toLowerCase()}`, year, full ? 30 * 60 : 5 * 60); // 해금은 30분 늦게 반영돼도 괜찮다
  return year;
}

// 테스트에서 기억해 둔 올해 활동을 지울 때 쓴다.
export function clearYearMemory() {
  yearMemory.clear();
}
