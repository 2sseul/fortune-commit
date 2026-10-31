// fortune-commit 사이트 공통 스크립트 (v3)
// 모든 페이지에 똑같이 들어가는 것을 여기서 만든다.
//   - 위쪽 막대(Figma TopNav): 로고, 메뉴, 로그인 버튼 또는 🔥 연속 기록 · 🍪 포인트 · 프로필 메뉴
//   - 아래 탭 막대(Figma MobileTabBar, 휴대폰만): 홈 · 진열대 · 도감 · 상점 · 일기
//   - 푸터, 알림(토스트), 복사 버튼, 쿠키 목록 불러오기
// 페이지에는 <header id="topnav"></header>와 <footer id="footer"></footer> 자리만 두면 된다.

// 메뉴: 주소, 이름, 아이콘
const MENU = [
  ['/', '홈', '/img/icons/home.svg'],
  ['/skins.html', '진열대', '/cookies/plain.svg'],
  ['/collection.html', '도감', '/img/icons/book.svg'],
  ['/shop.html', '상점', '/img/icons/shop.svg'],
  ['/diary.html', '운세 일기', '/img/icons/calendar.svg', '일기'],
];

const here = () => (location.pathname === '/index.html' ? '/' : location.pathname);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}
export { el };

function navLinks(className, short) {
  const nav = el('nav', { class: className, 'aria-label': className === 'tabbar' ? '아래 메뉴' : '메뉴' });
  for (const [href, label, icon, shortLabel] of MENU) {
    nav.append(el('a', { href, 'aria-current': href === here() ? 'page' : null },
      el('img', { src: icon, alt: '', width: 28, height: 28 }),
      el('span', { class: 'label', text: short && shortLabel ? shortLabel : label })));
  }
  return nav;
}

// 화면에 들어올 때 나타나는 움직임: selector에 맞는 요소들에 .reveal을 붙이고, 보이면 .in을 붙인다.
//   같은 묶음 안의 형제들은 순서대로 조금씩 늦게 나타난다. (움직임 줄이기 설정이면 바로 보인다)
export function setupReveal(selector) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const node of document.querySelectorAll(selector)) {
    const index = [...node.parentElement.children].indexOf(node);
    node.style.setProperty('--delay', `${Math.min(index, 6) * 0.07}s`);
    node.classList.add('reveal');
    observer.observe(node);
  }
}

// 창(dialog)이나 아래 시트가 열려 있는 동안 뒤 페이지가 스크롤되지 않게 한다. (모든 페이지 공통)
let scrollLockReady = false;
function setupScrollLock() {
  if (scrollLockReady) return;
  scrollLockReady = true;
  const sync = () => {
    const open = document.querySelector('dialog[open], .detail.open');
    document.documentElement.classList.toggle('modal-open', Boolean(open));
  };
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'class'] });
  sync();
}

function renderChrome() {
  setupScrollLock();
  const header = document.getElementById('topnav');
  if (header && !header.dataset.ready) {
    header.dataset.ready = '1';
    header.className = 'topnav';
    header.append(el('div', { class: 'wrap' },
      el('a', { class: 'brand', href: '/' }, el('img', { src: '/cookies/plain.svg', alt: '', width: 32, height: 32 }), el('span', { class: 'brand-name', text: 'fortune-commit' })),
      navLinks('navlinks'),
      el('div', { class: 'account', id: 'account-slot' })));
  }
  if (!document.querySelector('.tabbar')) document.body.append(navLinks('tabbar', true));
  const footer = document.getElementById('footer');
  if (footer && !footer.dataset.ready) {
    footer.dataset.ready = '1';
    footer.className = 'site-footer';
    footer.append(el('div', { class: 'wrap' },
      el('div', {}, el('strong', { text: 'fortune-commit' }), el('small', { text: '모든 쿠키 그림은 오리지널이에요' })),
      el('nav', { 'aria-label': '아래 링크' },
        el('a', { href: '/skins.html', text: '쿠키 진열대' }),
        el('a', { href: '/collection.html', text: '내 도감' }),
        el('a', { href: 'https://github.com/2sseul/fortune-commit', text: 'GitHub' }))));
  }
  if (!document.getElementById('toast')) document.body.append(el('div', { class: 'toast', id: 'toast', role: 'status', 'aria-live': 'polite' }));
}

// 🔥 연속 기록 · 🍪 포인트 숫자 칩
export function statChip(icon, value, label, extraClass = '') {
  return el('span', { class: `stat ${extraClass}`.trim(), title: label },
    el('img', { src: icon, alt: '' }), el('span', { text: value }), el('span', { class: 'visually-hidden', text: label }));
}
const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

// 로그인 상태를 확인해서 위쪽 막대를 채운다. 로그인 정보({ loggedIn, login, equipped })를 돌려준다.
export async function setupHeader() {
  renderChrome();
  let me = { loggedIn: false };
  try {
    me = await (await fetch('/api/me?brief=1', { cache: 'no-store' })).json();
  } catch {
    // 확인하지 못하면 로그인 버튼을 그대로 둔다.
  }
  const slot = document.getElementById('account-slot');
  if (!slot) return me;

  if (!me.loggedIn) {
    // 로그인 후 지금 보던 페이지로 돌아오게 한다.
    slot.replaceChildren(el('a', { class: 'btn small', href: `/api/auth/login?next=${encodeURIComponent(location.pathname)}`, text: isPhone() ? '로그인' : 'GitHub 로그인' }));
    return me;
  }

  document.getElementById('topnav')?.classList.add('logged-in');
  const stats = el('div', { class: 'stats', id: 'header-stats' });
  const button = el('button', { type: 'button', class: 'avatar-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': `${me.login} 메뉴` },
    el('img', { src: `https://github.com/${encodeURIComponent(me.login)}.png?size=72`, alt: '' }));
  const menu = el('ul', { class: 'account-menu', hidden: true });
  menu.append(el('li', { class: 'who', text: `@${me.login}` }));
  for (const [label, href] of [['내 도감', '/collection.html'], ['쿠키 상점', '/shop.html'], ['운세 일기', '/diary.html'], ['로그아웃', '/api/auth/logout']]) {
    menu.append(el('li', {}, el('a', { href, text: label })));
  }
  const close = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (event) => { if (!menu.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  slot.replaceChildren(stats, button, menu);
  return me;
}

// 위쪽 막대의 🔥·🍪 숫자를 채운다. (페이지가 지갑·연속 기록을 불러온 뒤 부른다)
export function setHeaderStats({ streak, balance }) {
  const stats = document.getElementById('header-stats');
  if (!stats) return;
  const chips = [];
  if (streak !== undefined && streak !== null) chips.push(statChip('/img/icons/flame.svg', String(streak), '일 연속'));
  if (balance !== undefined && balance !== null) chips.push(statChip('/img/icons/point.svg', balance.toLocaleString('ko-KR'), '포인트'));
  stats.replaceChildren(...chips);
}

// 로그인했으면 숫자 칩을 알아서 채운다. (상점·도감처럼 따로 불러오는 페이지는 setHeaderStats를 직접 쓴다)
export async function fillHeaderStats() {
  try {
    const daily = await (await fetch('/api/daily', { cache: 'no-store' })).json();
    if (daily.loggedIn) setHeaderStats({ streak: daily.streak, balance: daily.wallet?.balance });
    return daily;
  } catch {
    return null;
  }
}

// 잠깐 떴다 사라지는 알림
let toastTimer = null;
export function toast(message, ms = 2600) {
  const box = document.getElementById('toast');
  if (!box) return;
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), ms);
}

// 코드 복사 버튼: 누르면 복사하고 잠깐 "복사됨!"을 보여준다.
export async function copyText(button, text, doneText = '복사됨!') {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = doneText;
  } catch {
    button.textContent = '직접 선택해 주세요';
  }
  setTimeout(() => { button.textContent = original; }, 1500);
}

// 쿠키 65종 목록 (public/cookies/catalog.json, scripts/sync-cookies.mjs가 만든다)
let catalogPromise = null;
export function loadCatalog() {
  catalogPromise ??= fetch('/cookies/catalog.json').then((r) => r.json());
  return catalogPromise;
}
export const cookieSrc = (id) => `/cookies/${id}.svg`;

// 분류 탭에 쓰는 이름 (catalog의 category → 화면 이름)
export const CATEGORY_LABEL = { 기존: '기존', 활동: '활동', 시즌: '시즌', 언어: '언어', 밈: '개발자 밈', 특별: '특별', 뽑기: '뽑기' };

// 운세 쪽지 문구를 문장마다 한 줄씩 나눈다. (문장 중간에서 줄이 바뀌지 않게)
//   '요즘 리듬이 좋아요. 오늘 쓰는 코드도 술술 써질 거예요.' → ['요즘 리듬이 좋아요.', '오늘 쓰는 코드도 술술 써질 거예요.']
//   한 문장이 쪽지보다 길면 그 안에서는 단어 단위로 줄이 바뀐다. (site.css의 word-break: keep-all)
export function sentenceLines(text) {
  // 문장 끝 부호(. ! ? ~) 다음에 띄어쓰기가 올 때만 나눈다. ('v1.2', '3.14'는 나누지 않는다)
  const lines = String(text ?? '').split(/(?<=[.!?~。]["'”’)]?)\s+/);
  return lines.map((line) => line.trim()).filter(Boolean).map((line) => el('span', { text: line }));
}
export function fortuneSlip(text, extraClass = '') {
  return el('p', { class: `slip lines ${extraClass}`.trim() }, ...sentenceLines(text));
}

// 진행 막대
export function progressBar(current, goal, text, extraClass = '') {
  const ratio = goal > 0 ? Math.min(1, current / goal) : 1;
  return el('div', { class: `progress ${extraClass}`.trim(), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': goal, 'aria-valuenow': current },
    el('i', { style: `width:${Math.max(ratio * 100, ratio > 0 ? 8 : 0)}%` }), el('span', { text: text ?? `${current.toLocaleString('ko-KR')} / ${goal.toLocaleString('ko-KR')}` }));
}

// POST 요청 (JSON)
export async function postJson(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data = {};
  try { data = await response.json(); } catch { /* 빈 응답 */ }
  return { ok: response.ok, status: response.status, data };
}

// ---------- 오른쪽 패널 (Figma RightPanel: 상점·도감) ----------
// daily: /api/daily 결과, equipped: 장착한 쿠키 아이디, next: 곧 해금될 쿠키 목록, cookies: 쿠키 목록(catalog)
const QUEST_ICON = { flame: '/img/icons/flame.svg', calendar: '/img/icons/calendar.svg', cookie: '/img/icons/point.svg' };
export function questRow(q) {
  const reward = q.reward === 'cookie'
    ? el('span', { class: 'reward' }, el('img', { src: cookieSrc(q.cookie), alt: '' }), '쿠키')
    : el('span', { class: 'reward' }, el('img', { src: '/img/icons/point.svg', alt: '' }), `+${q.reward}`);
  return el('div', { class: `quest ${q.done ? 'done' : ''}`.trim() },
    el('span', { class: 'icon' }, el('img', { src: q.reward === 'cookie' ? cookieSrc(q.cookie) : QUEST_ICON[q.icon], alt: '' })),
    el('div', {}, el('p', { class: 'label', text: q.label }), progressBar(q.current, q.goal)),
    reward);
}
export function renderSidePanel(aside, { daily, equipped, next = [], cookies = [], showNext = false }) {
  const label = (id) => cookies.find((c) => c.id === id)?.label ?? id;
  const cards = [];
  if (daily?.quests) {
    cards.push(el('section', { class: 'card' },
      el('div', { class: 'card-title' }, el('h2', { class: 'h3', text: '오늘의 퀘스트' }), el('a', { href: '/#daily', text: '모두 보기' })),
      ...daily.quests.filter((q) => q.id === 'commit' || q.id === 'open').map(questRow)));
  }
  if (equipped !== undefined) {
    const id = equipped ?? 'plain';
    cards.push(el('section', { class: 'card' },
      el('div', { class: 'card-title' }, el('h2', { class: 'h3', text: '장착 중인 쿠키' }), el('a', { href: '/collection.html', text: '바꾸기' })),
      el('div', { style: 'display:flex;gap:12px;align-items:center' },
        el('span', { style: 'display:grid;place-items:center;width:64px;height:64px;border-radius:14px;background:var(--dough);flex:none' }, el('img', { src: cookieSrc(id), alt: '', style: 'height:46px' })),
        el('div', {}, el('p', { style: 'font-weight:700', text: label(id) }), el('p', { class: 'small', text: equipped ? '위젯에 올라가 있어요' : '아직 고르지 않았어요' })))));
  }
  if (showNext && next.length) {
    // 곧 해금될 쿠키: 아이콘은 그 쿠키 그림, 보상 칸 없이 진행 막대만
    cards.push(el('section', { class: 'card' },
      el('h2', { class: 'h3', style: 'margin-bottom:12px', text: '곧 해금될 쿠키' }),
      ...next.map((n) => el('div', { class: 'quest', style: 'grid-template-columns:36px minmax(0,1fr)' },
        el('span', { class: 'icon' }, el('img', { src: cookieSrc(n.id), alt: '' })),
        el('div', {}, el('p', { class: 'label', text: label(n.id) }), progressBar(n.current, n.goal))))));
  }
  aside.replaceChildren(...cards);
}
