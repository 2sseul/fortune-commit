// 첫 화면 "빵집 안" 장면의 인터랙션
//   - 반죽이의 눈이 마우스를 따라오고, 누르면 말풍선으로 한마디
//   - 진열장 쿠키를 누르면 반죽이가 해금 조건을 알려줌
//   - 접시 위 쿠키를 누르면 갈라지고 운세 쪽지가 뜸 (잠겨 있으면 "아직 굽는 중")
//   - 조명을 누르면 흔들림

const LUCKY_LABELS = {
  lucky_status: '행운의 상태코드',
  lucky_shortcut: '행운의 단축키',
  lucky_language: '행운의 언어',
  lucky_command: '행운의 명령어',
  skin: '다음 스킨까지',
};

// 반죽이가 아무 때나 하는 말
const CHATTER = [
  '어서 오세요! 갓 구운 운세 있어요.',
  '오늘 커밋은 하셨어요?',
  '접시 위 쿠키를 눌러 보세요!',
  '진열장 쿠키는 활동으로 모을 수 있어요.',
  '0시마다 새로 구워요. 오늘도 맛있게!',
  '반죽은 매일 하는 게 제일 맛있대요.',
];

export function setupScene({ skins, getFortune, onOpen }) {
  const scene = document.getElementById('scene');
  const mascot = document.getElementById('mascot');
  const bubble = document.getElementById('bubble');
  const pupils = [...document.querySelectorAll('.pupil')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 말풍선 ----------
  let bubbleTimer = null;
  function say(text, ms = 3200) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function bounce() {
    if (reduceMotion) return;
    mascot.classList.remove('bounce');
    void mascot.offsetWidth; // 애니메이션을 처음부터 다시 재생하기 위한 트릭
    mascot.classList.add('bounce');
  }

  // ---------- 눈이 마우스를 따라온다 ----------
  scene.addEventListener('pointermove', (event) => {
    if (reduceMotion) return;
    for (const pupil of pupils) {
      const eye = pupil.closest('.eye').getBoundingClientRect();
      const cx = eye.left + eye.width / 2;
      const cy = eye.top + eye.height / 2;
      const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
      const distance = Math.min(3, Math.hypot(event.clientX - cx, event.clientY - cy) / 40);
      pupil.setAttribute('transform', `translate(${Math.cos(angle) * distance} ${Math.sin(angle) * distance})`);
    }
  });
  scene.addEventListener('pointerleave', () => pupils.forEach((p) => p.setAttribute('transform', '')));

  // ---------- 반죽이를 누르면 ----------
  let chatterIndex = 0;
  mascot.addEventListener('click', () => {
    bounce();
    say(CHATTER[chatterIndex % CHATTER.length]);
    chatterIndex += 1;
  });

  // ---------- 조명을 누르면 흔들린다 ----------
  for (const lamp of document.querySelectorAll('.lamp')) {
    lamp.addEventListener('click', () => {
      lamp.classList.remove('swing');
      void lamp.offsetWidth;
      lamp.classList.add('swing');
    });
  }

  // ---------- 진열장 쿠키 ----------
  const trays = document.querySelectorAll('.case .tray');
  skins.forEach(([id, name, rule], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${name}: ${rule}`);
    const img = document.createElement('img');
    img.src = `/api/cookie?skin=${id}&mode=still`;
    img.alt = '';
    button.append(img);
    button.addEventListener('click', () => {
      bounce();
      say(id === 'plain' ? `${name}는 누구나 받을 수 있어요!` : `${name}는 ${rule}면 드려요!`);
    });
    trays[index < 6 ? 0 : 1].append(button);
  });

  // ---------- 빵 부스러기 ----------
  function crumbs(fromElement) {
    if (reduceMotion) return;
    const sceneBox = scene.getBoundingClientRect();
    const box = fromElement.getBoundingClientRect();
    const x = box.left - sceneBox.left + box.width / 2;
    const y = box.top - sceneBox.top + box.height / 2;
    for (let i = 0; i < 14; i += 1) {
      const crumb = document.createElement('span');
      crumb.className = 'crumb';
      crumb.style.left = `${x}px`;
      crumb.style.top = `${y}px`;
      const angle = Math.random() * Math.PI * 2;
      const power = 40 + Math.random() * 70;
      crumb.style.setProperty('--dx', `${Math.cos(angle) * power}px`);
      crumb.style.setProperty('--dy', `${Math.sin(angle) * power - 30}px`);
      crumb.style.background = ['#e8a23c', '#c17f2a', '#ffd98a'][i % 3];
      scene.append(crumb);
      setTimeout(() => crumb.remove(), 1000);
    }
  }

  // ---------- 접시 위 포춘쿠키 ----------
  const spot = document.getElementById('plate-spot');
  const cookieButton = document.getElementById('cookie');
  const cookieImg = document.getElementById('cookie-img');
  const pop = document.getElementById('fortune-pop');

  function showSlip({ who, text, tags = [], note }) {
    const slip = pop.querySelector('.slip');
    slip.replaceChildren();
    const whoLine = document.createElement('p');
    whoLine.className = 'who';
    whoLine.textContent = who;
    const body = document.createElement('p');
    body.className = 'fortune';
    body.textContent = text;
    slip.append(whoLine, body);
    if (tags.length) {
      const list = document.createElement('div');
      list.className = 'tags';
      for (const { key, value } of tags) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        const label = document.createElement('b');
        label.textContent = LUCKY_LABELS[key] ?? key;
        tag.append(label, ` ${value}`);
        list.append(tag);
      }
      slip.append(list);
    }
    if (note) {
      const p = document.createElement('p');
      p.className = 'who';
      p.style.margin = '12px 0 0';
      p.textContent = note;
      slip.append(p);
    }
    pop.classList.add('show');
    pop.querySelector('.close').focus({ preventScroll: true });
  }
  pop.querySelector('.close').addEventListener('click', () => {
    pop.classList.remove('show');
    cookieButton.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') pop.classList.remove('show'); });

  let opened = false;
  cookieButton.addEventListener('click', async () => {
    const fortune = await getFortune();
    const who = fortune?.user ? `${fortune.user} 님의 오늘의 운세` : '오늘의 운세';

    if (!fortune || fortune.locked) {
      cookieImg.classList.remove('wiggle');
      void cookieImg.offsetWidth;
      cookieImg.classList.add('wiggle');
      bounce();
      say(fortune ? '아직 굽는 중이에요! 오늘 첫 커밋을 올리면 열려요.' : '오븐이 잠깐 멈췄어요. 다시 눌러 주세요!');
      return;
    }

    // 갈라지는 쿠키로 바꾸고, 부스러기와 함께 쪽지를 띄운다.
    spot.classList.add('done');
    cookieImg.src = `/api/cookie?skin=${fortune.skin}&mode=crack&t=${Date.now()}`;
    setTimeout(() => {
      crumbs(cookieButton);
      bounce();
      say(opened ? '같은 날엔 몇 번을 열어도 같은 운세예요.' : '짜잔! 오늘의 운세가 나왔어요!');
      opened = true;
      onOpen?.(fortune, api);
    }, 550);
    setTimeout(() => {
      showSlip({
        who,
        text: fortune.fortune,
        tags: fortune.lucky,
        note: fortune.user ? null : '로그인하면 나만의 운세와 내 쿠키 스킨으로 볼 수 있어요.',
      });
    }, 1150);
  });

  // 접시 위에 포인트가 폴짝 떠오른다. (출석 보상)
  function points(text) {
    const pop = document.createElement('span');
    pop.className = 'points-pop';
    pop.textContent = text;
    spot.append(pop);
    setTimeout(() => pop.remove(), 1800);
  }

  // 처음 들어오면 반죽이가 인사한다.
  setTimeout(() => say(CHATTER[0], 3600), 700);
  const api = { say, points };
  return api;
}
