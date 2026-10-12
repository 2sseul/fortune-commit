// /api 주소로 요청이 오면 포춘쿠키 위젯 SVG를 돌려주는 서버리스 함수
// Vercel은 api/index.js 파일을 자동으로 /api 주소에 연결한다.
//
// 커밋하고 열기: user의 오늘 GitHub 기여가 0개면 '잠긴 쿠키', 1개 이상이면 '열린 쿠키 + 운세'를 보여준다.
// 운세는 지난 7일 기여 수와 주 사용 언어에 맞춘 문구로 고른다.
// (토큰이 없거나 확인에 실패하면 잠그지 않고 기본 운세를 보여준다)
//
// 사용 가능한 옵션 (주소 뒤에 ?이름=값 으로 붙인다)
//   user  : GitHub 아이디. 아이디 + 날짜로 그날의 운세가 정해진다. (없으면 공통 운세, 잠금 없음)
//   lang  : ko(기본) 또는 en
//   tz    : 하루가 바뀌는 기준 시간대. 기본은 Asia/Seoul (예: UTC, America/New_York)
//   theme : dark(기본) 또는 light. 위젯 주인이 상점에서 산 테마를 장착했으면 그 테마가 우선한다. (v2.2)
//           디저트 테마(vanilla, strawberry, mintchoco, blueberry, darkchoco)는 preview와 함께일 때만 주소로 볼 수 있다.
//   width : 위젯 너비 400 ~ 800 (기본 495)
//   radius : 모서리 둥글기 0 ~ 30 (기본 10)
//   hide_border : true면 테두리 선을 숨긴다
//   skin  : 쿠키 스킨 이름 (plain, choco, matcha, gold, cat, dog, rabbit, pumpkin, snowman, deer, santa).
//           해금 조건(src/unlocks.js)을 채워야 적용되고, 아니면 기본 쿠키 + 진행 상황을 보여준다.
//           위젯 주인이 사이트(도감)에서 장착한 스킨이 있으면 그 설정이 항상 우선한다. (v2.1)
//   preview : (테스트용) locked면 잠긴 화면, open이면 열린 화면을 기여 수·스킨 해금과 상관없이 보여준다
//   잘못된 값은 기본값으로, 범위를 벗어난 값은 가장 가까운 허용값으로 바꾼다. (src/options.js)

import { getTheme } from '../src/themes.js';
import { renderWidget, renderClosedCard } from '../src/render.js';
import { parseStyleOptions } from '../src/options.js';
import { resolveWidget } from '../src/widget-data.js';

export default async function handler(req, res) {
  // 주소 뒤의 옵션을 읽는다.
  const { searchParams } = new URL(req.url, 'http://localhost');
  const style = parseStyleOptions(searchParams);

  // 오늘의 운세·잠금·스킨 정하기 (사이트 첫 화면의 큰 쿠키와 같은 규칙, src/widget-data.js)
  const widget = await resolveWidget({
    user: searchParams.get('user'),
    lang: searchParams.get('lang'),
    tz: searchParams.get('tz'),
    skin: searchParams.get('skin'),
    preview: searchParams.get('preview'),
  });
  const en = widget.lang === 'en';
  const theme = widget.theme
    ? getTheme(widget.theme, { allowShop: true })
    : getTheme(searchParams.get('theme'), { allowShop: Boolean(searchParams.get('preview')) });

  const svg = widget.locked
    ? renderClosedCard({
      theme,
      command: widget.command,
      hint: en ? 'Commit today to open it' : '오늘 커밋하면 열려요',
      label: en
        ? "Today's fortune cookie is locked. Make a contribution today to open it."
        : '오늘의 포춘쿠키가 잠겨 있어요. 오늘 기여를 하면 열려요.',
      detail: { key: 'today_contributions', value: '0' },
      style,
      skin: widget.skin,
    })
    : renderWidget({
      theme,
      command: widget.command,
      fortune: widget.fortune,
      lucky: [...widget.lucky, ...widget.progressLine],
      label: en ? "Today's fortune" : '오늘의 운세',
      style,
      skin: widget.skin,
    });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  // GitHub는 README 이미지를 자체 서버(camo)에 캐시하는데, 이 시간이 지나면 새로 받아 간다.
  res.setHeader('Cache-Control', `public, max-age=${widget.cacheSeconds}, s-maxage=${widget.cacheSeconds}`);
  res.end(svg);
}
