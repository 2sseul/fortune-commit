// fortune-commit 사이트 공통 스크립트
// 헤더의 로그인 상태(로그인 버튼 ↔ 프로필 사진·아이디 메뉴)를 모든 페이지에서 똑같이 보여준다.
// 페이지에 <span id="account-slot"> 이 있으면 그 자리를 채운다.

// 로그인 상태를 확인해서 헤더를 채운다. 로그인 정보({ loggedIn, login, equipped })를 돌려준다.
export async function setupHeader() {
  let me = { loggedIn: false };
  try {
    me = await (await fetch('/api/me?brief=1', { cache: 'no-store' })).json();
  } catch {
    // 확인하지 못하면 로그인 버튼을 그대로 둔다.
  }
  const slot = document.getElementById('account-slot');
  if (!slot) return me;

  if (!me.loggedIn) {
    const login = document.createElement('a');
    login.className = 'btn small';
    // 로그인 후 지금 보던 페이지로 돌아오게 한다.
    login.href = `/api/auth/login?next=${encodeURIComponent(location.pathname)}`;
    login.textContent = 'GitHub 로그인';
    slot.replaceChildren(login);
    return me;
  }

  const box = document.createElement('div');
  box.className = 'account';
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  const avatar = document.createElement('img');
  avatar.src = `https://github.com/${encodeURIComponent(me.login)}.png?size=64`;
  avatar.alt = '';
  const name = document.createElement('span');
  name.textContent = me.login;
  button.append(avatar, name);

  const menu = document.createElement('ul');
  menu.hidden = true;
  for (const [label, href] of [['내 도감', '/collection.html'], ['스킨 진열대', '/skins.html'], ['로그아웃', '/api/auth/logout']]) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.append(a);
    menu.append(li);
  }
  const close = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
  button.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    button.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', (event) => { if (!box.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

  box.append(button, menu);
  slot.replaceChildren(box);
  return me;
}

// 코드 복사 버튼: 누르면 복사하고 잠깐 "복사됨!"을 보여준다.
export async function copyText(button, text) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '복사됨!';
  } catch {
    button.textContent = '직접 선택해 주세요';
  }
  setTimeout(() => { button.textContent = original; }, 1500);
}
