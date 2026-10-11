// /api 주소로 요청이 오면 포춘쿠키 위젯 SVG를 돌려주는 서버리스 함수
// Vercel은 api/index.js 파일을 자동으로 /api 주소에 연결한다.
//
// 사용 가능한 옵션 (주소 뒤에 ?이름=값 으로 붙인다)
//   user  : GitHub 아이디. 아이디 + 날짜로 그날의 운세가 정해진다. (없으면 공통 운세)
//   lang  : ko(기본) 또는 en
//   tz    : 하루가 바뀌는 기준 시간대. 기본은 Asia/Seoul (예: UTC, America/New_York)
//   theme : dark(기본) 또는 light
//   width : 위젯 너비 400 ~ 800 (기본 495)
//   radius : 모서리 둥글기 0 ~ 30 (기본 10)
//   hide_border : true면 테두리 선을 숨긴다
//   state : closed면 '안 열린 쿠키 카드'를 보여준다 (README 접기 기능의 제목용)
//   잘못된 값은 기본값으로, 범위를 벗어난 값은 가장 가까운 허용값으로 바꾼다. (src/options.js)

import { getTheme } from '../src/themes.js';
import { renderWidget, renderClosedCard } from '../src/render.js';
import { pickFortune, todayIn, normalizeUser, secondsUntilMidnight } from '../src/pick.js';
import { parseStyleOptions } from '../src/options.js';

export default function handler(req, res) {
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

  let svg;
  if (searchParams.get('state') === 'closed') {
    // 안 열린 쿠키 카드: 운세는 보여주지 않고 "눌러서 열기" 안내만 보여준다.
    svg = renderClosedCard({
      theme,
      command,
      hint: lang === 'en' ? 'Click to open your fortune' : '눌러서 오늘의 운세 열기',
      label: lang === 'en' ? 'Click to open today\'s fortune cookie' : '눌러서 오늘의 포춘쿠키 열기',
      style,
    });
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
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // 운세는 자정에 바뀌므로 다음 자정까지만 캐시한다.
  // (GitHub는 README 이미지를 자체 서버에 캐시하는데, 이 시간이 지나면 새로 받아 간다)
  // 단, 너무 오래 묵지 않도록 최대 1시간으로 제한한다.
  const maxAge = Math.max(60, Math.min(3600, secondsUntilMidnight(tz)));
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  res.end(svg);
}
