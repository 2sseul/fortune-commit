// GitHub README 이미지 캐시 비우기 (v3.1)
// GitHub는 README 이미지를 자기 프록시(camo.githubusercontent.com)에 저장해 두고 보여준다.
// 그래서 도감에서 쿠키를 바꿔도 README에는 한동안 옛 쿠키가 보인다.
// 장착을 바꾸면 그 사람의 GitHub 프로필 페이지에서 우리 위젯 이미지의 camo 주소를 찾아 PURGE를 보내 바로 비운다.
//   - 공개 프로필 페이지만 읽는다. (저장소 권한·토큰 필요 없음)
//   - camo 주소는 '서명/원래 주소를 16진수로' 꼴이라, 뒷부분을 풀어 우리 위젯인지 확인한다.
//   - 실패해도 장착은 그대로 된다. (위젯 캐시가 짧아서 몇 분 안에 바뀐다)

const CAMO = /https:\/\/camo\.githubusercontent\.com\/[0-9a-f]+\/([0-9a-f]+)/g;
export const WIDGET_HOSTS = ['fortune-commit.vercel.app'];

// 프로필 페이지 HTML에서 우리 위젯 이미지의 camo 주소만 고른다.
export function findWidgetCamoUrls(html, hosts = WIDGET_HOSTS) {
  const found = new Set();
  for (const match of html.matchAll(CAMO)) {
    const original = Buffer.from(match[1], 'hex').toString('utf8');
    try {
      const url = new URL(original);
      if (hosts.includes(url.host) && url.pathname.startsWith('/api')) found.add(match[0]);
    } catch {
      // 주소가 아니면 건너뛴다.
    }
  }
  return [...found];
}

// 프로필 README의 위젯 캐시를 비운다. → 비운 이미지 수 (실패하면 0)
export async function purgeReadmeWidgets(login, { fetchImpl = fetch } = {}) {
  try {
    const page = await fetchImpl(`https://github.com/${encodeURIComponent(login)}`, {
      headers: { 'User-Agent': 'fortune-commit', Accept: 'text/html' },
      signal: AbortSignal.timeout(4000),
    });
    if (!page.ok) return 0;
    const urls = findWidgetCamoUrls(await page.text());
    const results = await Promise.all(urls.map((url) => fetchImpl(url, { method: 'PURGE', signal: AbortSignal.timeout(4000) })
      .then((r) => r.ok).catch(() => false)));
    return results.filter(Boolean).length;
  } catch {
    return 0;
  }
}
