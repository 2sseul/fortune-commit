// /api 주소로 요청이 오면 포춘쿠키 위젯 SVG를 돌려주는 서버리스 함수
// Vercel은 api/index.js 파일을 자동으로 /api 주소에 연결한다.
//
// 커밋하고 열기: user의 오늘 GitHub 기여가 0개면 '잠긴 쿠키', 1개 이상이면 '열린 쿠키 + 운세'를 보여준다.
// (토큰이 없거나 확인에 실패하면 운세를 그대로 보여준다)
//
// 사용 가능한 옵션 (주소 뒤에 ?이름=값 으로 붙인다)
//   user  : GitHub 아이디. 아이디 + 날짜로 그날의 운세가 정해진다. (없으면 공통 운세, 잠금 없음)
//   lang  : ko(기본) 또는 en
//   tz    : 하루가 바뀌는 기준 시간대. 기본은 Asia/Seoul (예: UTC, America/New_York)
//   theme : dark(기본) 또는 light
//   width : 위젯 너비 400 ~ 800 (기본 495)
//   radius : 모서리 둥글기 0 ~ 30 (기본 10)
//   hide_border : true면 테두리 선을 숨긴다
//   잘못된 값은 기본값으로, 범위를 벗어난 값은 가장 가까운 허용값으로 바꾼다. (src/options.js)

import { getTheme } from '../src/themes.js';
import { renderWidget, renderClosedCard } from '../src/render.js';
import { pickFortune, todayIn, normalizeUser, secondsUntilMidnight } from '../src/pick.js';
import { parseStyleOptions } from '../src/options.js';
import { countTodayContributions } from '../src/github.js';

const LOCKED_CACHE_SECONDS = 5 * 60; // 잠긴 화면은 5분만 캐시 (커밋하면 곧 열리도록)

export default async function handler(req, res) {
  // 주소 뒤의 옵션을 읽는다.
  const { searchParams } = new URL(req.url, 'http://localhost');
  const theme = getTheme(searchParams.get('theme'));
  const user = normalizeUser(searchParams.get('user'));
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const tz = searchParams.get('tz');
  const date = todayIn(tz);
  const style = parseStyleOptions(searchParams);

  // 터미널에 입력한 것처럼 보이는 명령어. 아이디가 있으면 --user로 보여준다.
  const command = user ? `fortune --user ${user}` : 'fortune --today';

  // 오늘 기여 수 확인 (확인할 수 없으면 null → 잠그지 않는다)
  const contributions = await countTodayContributions({ login: user, timeZone: tz, date });
  const locked = contributions === 0;

  let svg;
  let cacheSeconds;
  if (locked) {
    svg = renderClosedCard({
      theme,
      command,
      hint: lang === 'en' ? 'Commit today to open it' : '오늘 커밋하면 열려요',
      label: lang === 'en'
        ? "Today's fortune cookie is locked. Make a contribution today to open it."
        : '오늘의 포춘쿠키가 잠겨 있어요. 오늘 기여를 하면 열려요.',
      detail: { key: 'today_contributions', value: '0' },
      style,
    });
    cacheSeconds = LOCKED_CACHE_SECONDS;
  } else {
    const { fortune, lucky } = pickFortune({ user, date, lang });
    svg = renderWidget({
      theme,
      command,
      fortune,
      lucky,
      label: lang === 'en' ? "Today's fortune" : '오늘의 운세',
      style,
    });
    // 운세는 자정에 바뀌므로 다음 자정까지만 캐시한다. 단, 너무 오래 묵지 않게 최대 1시간.
    cacheSeconds = Math.max(60, Math.min(3600, secondsUntilMidnight(tz)));
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // GitHub는 README 이미지를 자체 서버(camo)에 캐시하는데, 이 시간이 지나면 새로 받아 간다.
  res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`);
  res.end(svg);
}
