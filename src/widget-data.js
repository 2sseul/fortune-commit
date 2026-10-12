// 위젯에 보여줄 내용을 정하는 모듈
// README 위젯(/api)과 사이트 첫 화면의 큰 쿠키(/api/fortune)가 똑같은 운세·잠금·스킨을 쓰도록 한곳에서 정한다.

import { getSkin } from './skins.js';
import { getProfile, addEarnedSkins } from './store.js';
import { pickFortune, todayIn, normalizeUser, secondsUntilMidnight } from './pick.js';
import { fetchActivity, fetchYearActivity } from './github.js';
import { skinStatus, progressText, newlyEarned } from './unlocks.js';

const LOCKED_CACHE_SECONDS = 5 * 60; // 잠긴 화면은 5분만 캐시 (커밋하면 곧 열리도록)

// 주소 옵션으로 오늘의 위젯 내용을 정한다.
//   user, lang, tz, skin(README의 skin=), preview(테스트용 locked/open)
// 돌려주는 값: { user, lang, date, command, skin, theme, locked, fortune, lucky, progressLine, cacheSeconds }
//   theme: 주인이 상점에서 사서 장착한 테마 이름 (없으면 null → 주소의 theme=을 쓴다)
export async function resolveWidget({ user: rawUser, lang: rawLang, tz, skin: skinParam, preview }) {
  const user = normalizeUser(rawUser);
  const lang = rawLang === 'en' ? 'en' : 'ko';
  const date = todayIn(tz);
  const isPreview = preview === 'locked' || preview === 'open';

  // 스킨: 주인이 도감에서 장착한 스킨 → 없으면 README의 skin= → 없으면 기본 쿠키
  //       (미리보기에서는 장착 설정을 보지 않고 주소의 skin=을 그대로 쓴다)
  const profile = user && !isPreview ? await getProfile(user) : null;
  const requestedSkin = getSkin(profile?.skin ?? skinParam);
  const owned = new Set(profile?.owned ?? []);
  // 테마: 상점에서 산 테마를 장착했으면 그 테마 (v2.2)
  const theme = profile?.theme && owned.has(`theme:${profile.theme}`) ? profile.theme : null;

  // 터미널에 입력한 것처럼 보이는 명령어. 아이디가 있으면 --user로 보여준다.
  const command = user ? `fortune --user ${user}` : 'fortune --today';

  // GitHub 활동 확인 (확인할 수 없으면 null → 잠그지 않고, 고른 스킨을 그대로 보여준다)
  //   activity : 오늘 활동 수, 지난 7일 기여 수, 주 언어 → 잠금과 운세
  //   year     : 올해 활동 → 스킨 해금 (기본 쿠키이거나 미리보기면 확인하지 않는다)
  //   (상점에서 산 스킨과 예전에 해금한 스킨은 해금 조건을 보지 않는다)
  const boughtSkin = owned.has(`skin:${requestedSkin.id}`) || Boolean(profile?.earned?.includes(requestedSkin.id));
  const needYear = requestedSkin.id !== 'plain' && !isPreview && !boughtSkin;
  const [activity, year] = await Promise.all([
    fetchActivity({ login: user, timeZone: tz, date }),
    needYear ? fetchYearActivity({ login: user, timeZone: tz, date }) : null,
  ]);

  // 스킨 해금: 조건을 못 채웠으면 기본 쿠키를 쓰고, 진행 상황을 한 줄 보여준다.
  const status = isPreview || boughtSkin ? { unlocked: true } : skinStatus(requestedSkin.id, year);
  const skin = status.unlocked ? requestedSkin : getSkin('plain');
  // 올해 새로 해금한 스킨은 영원히 기록해 둔다. (DB에 연결된 경우에만, 실패해도 위젯은 그대로)
  if (profile && year) await addEarnedSkins(user, newlyEarned({ year, profile }));
  const progressLine = status.unlocked ? [] : [{ key: 'skin', value: progressText(requestedSkin.id, status) }];

  // 잠금: 오늘(기준 시간대 0시부터) 활동이 0이면 잠긴 쿠키. 미리보기는 주소대로.
  const locked = isPreview ? preview === 'locked' : activity?.today === 0;
  const { fortune, lucky } = pickFortune({ user, date, lang, activity });

  // 캐시: 잠긴 화면은 5분, 열린 화면은 다음 자정까지(최대 1시간)
  const cacheSeconds = locked ? LOCKED_CACHE_SECONDS : Math.max(60, Math.min(3600, secondsUntilMidnight(tz)));

  return { user, lang, date, command, skin, theme, locked, fortune, lucky, progressLine, cacheSeconds };
}
