# 빵집 캐릭터들 (듀오링고식: 큰 도형 + 그림자 한 단계 + 큰 눈)
#   oven   : 오븐이  - 0시에 쿠키를 굽는 친구 (창 안에 닫힌 쿠키)
#   laptop : 커밋이  - 커밋·push 담당 (화면이 얼굴)
#   milk   : 우유    - 쿠키 짝꿍, 응원 담당
#   dough  : 반죽이  - 요리사 모자를 쓴 빵집 주인 (mascot-solo.svg와 같은 그림, v3에서 여기로 옮김)
# 쿠키에는 얼굴을 넣지 않지만 캐릭터는 반죽이처럼 눈이 있다.
#
# v3: 캐릭터마다 SVG 안에 움직임(<style>)이 들어 있다. <img>로 넣어도 움직인다.
#   - 모두: 눈 깜빡임, 몸이 살짝 들썩임 (바닥 그림자는 그대로)
#   - 오븐이: 손잡이 흔들기, 창 불빛, 안의 쿠키가 부풀어 오름
#   - 커밋이: 오른팔 흔들기, 화면 코드 줄이 타이핑됨
#   - 우유: 두 팔을 번갈아 흔들기
#   - 반죽이: 모자 흔들림, 눈동자 굴리기, 숨쉬기
#   움직임 줄이기 설정이면 모두 멈춘다.
#   실행: python3 make_cast.py → oven.svg, laptop.svg, milk.svg, dough.svg (사이트에는 scripts/sync-cookies.mjs로 옮긴다)
import os
HERE = os.path.dirname(os.path.abspath(__file__))

BASE_STYLE = '''
  .body, .eyes, .arm, .part { transform-box: fill-box; }
  .body { transform-origin: 50% 100%; animation: bob 2.6s ease-in-out infinite; }
  .eyes { transform-origin: center; animation: blink 4.8s infinite; }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes blink { 0%, 91%, 97%, 100% { transform: scaleY(1); } 94% { transform: scaleY(0.08); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }'''

def svg(w, h, style, inner, view=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{view or f"0 0 {w} {h}"}">\n'
            f'<style>{BASE_STYLE}{style}\n</style>\n{inner}\n</svg>\n')

def eyes(cx, cy, gap=26, r=13, look=(3, 4), delay=0):
    lx, ly = look
    return (f'<g class="eyes" style="animation-delay:{delay}s">'
            f'<ellipse cx="{cx-gap}" cy="{cy}" rx="{r}" ry="{r*1.15}" fill="#FFFFFF"/>'
            f'<ellipse cx="{cx+gap}" cy="{cy}" rx="{r}" ry="{r*1.15}" fill="#FFFFFF"/>'
            f'<ellipse cx="{cx-gap+lx}" cy="{cy+ly}" rx="{r*0.55}" ry="{r*0.65}" fill="#3B2A1F"/>'
            f'<ellipse cx="{cx+gap+lx}" cy="{cy+ly}" rx="{r*0.55}" ry="{r*0.65}" fill="#3B2A1F"/>'
            f'<circle cx="{cx-gap+lx+3}" cy="{cy+ly-4}" r="{r*0.22}" fill="#FFFFFF"/>'
            f'<circle cx="{cx+gap+lx+3}" cy="{cy+ly-4}" r="{r*0.22}" fill="#FFFFFF"/></g>')

COOKIE = ('<g id="cookie">'
          '<path d="M20 2 C34 2 44 14 44 26 C44 36 36 40 30 38 C28 30 26 20 22 12 C20 8 18 4 20 2 Z" fill="#E39A30"/>'
          '<path d="M20 2 C8 2 0 14 0 28 C0 40 10 46 22 44 C26 43 28 40 28 36 C26 26 22 14 20 2 Z" fill="#F5B041"/>'
          '<path d="M0 34 C6 42 16 46 28 40 L28 46 L0 46 Z" fill="#E0912A" opacity="0.8"/>'
          '<path d="M6 16 C9 10 14 6 18 6" stroke="#FFD98A" stroke-width="4" stroke-linecap="round" fill="none"/></g>')

oven = svg(240, 260, '''
  .glow { animation: glow 2.2s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.85; } }
  .bake { transform-origin: 50% 100%; animation: rise 2.2s ease-in-out infinite; }
  @keyframes rise { 0%, 100% { transform: scale(0.92); } 50% { transform: scale(1.06) translateY(-2px); } }
  .handle-l { transform-origin: 100% 50%; animation: wiggle-l 1.3s ease-in-out infinite; }
  .handle-r { transform-origin: 0% 50%; animation: wiggle-r 1.3s ease-in-out infinite 0.65s; }
  @keyframes wiggle-l { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-14deg); } }
  @keyframes wiggle-r { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(14deg); } }''', f'''
  <ellipse cx="120" cy="248" rx="86" ry="10" fill="#000" opacity="0.08"/>
  <g class="body">
  <rect x="44" y="228" width="26" height="22" rx="8" fill="#B5332A"/><rect x="170" y="228" width="26" height="22" rx="8" fill="#B5332A"/>
  <rect x="24" y="40" width="192" height="196" rx="40" fill="#E8483C"/>
  <rect x="24" y="28" width="192" height="196" rx="40" fill="#FF6B5B"/>
  <rect x="44" y="44" width="152" height="54" rx="20" fill="#FF8C7E"/>
  {eyes(120, 70, gap=30, r=14, delay=0.4)}
  <rect x="48" y="112" width="144" height="94" rx="22" fill="#5C2A24"/>
  <rect x="56" y="120" width="128" height="78" rx="16" fill="#FFB347"/>
  <rect class="glow" x="56" y="120" width="128" height="78" rx="16" fill="#FFE9A8"/>
  <g class="part bake"><g transform="translate(96 136)">{COOKIE}</g></g>
  <path d="M64 130 L80 122" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  <rect x="88" y="208" width="64" height="10" rx="5" fill="#B5332A"/>
  <path class="part handle-l" d="M14 150 C2 150 0 130 12 126" stroke="#E8483C" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path class="part handle-r" d="M226 150 C238 150 240 130 228 126" stroke="#E8483C" stroke-width="14" stroke-linecap="round" fill="none"/>
  </g>''')

laptop = svg(260, 240, '''
  .wave { transform-box: view-box; transform-origin: 220px 170px; animation: wave 1.6s ease-in-out infinite; }
  @keyframes wave { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-16deg); } 50% { transform: rotate(6deg); } 75% { transform: rotate(-12deg); } }
  .type { transform-box: fill-box; transform-origin: 0 50%; animation: type 2.4s steps(6) infinite; }
  .type.b { animation-delay: 0.6s; }
  @keyframes type { 0% { transform: scaleX(0); } 60%, 100% { transform: scaleX(1); } }''', f'''
  <ellipse cx="130" cy="228" rx="100" ry="10" fill="#000" opacity="0.08"/>
  <g class="body">
  <rect x="40" y="20" width="180" height="140" rx="22" fill="#2B93CF"/>
  <rect x="40" y="14" width="180" height="140" rx="22" fill="#4FB8F5"/>
  <rect x="54" y="28" width="152" height="112" rx="14" fill="#1E2A38"/>
  {eyes(130, 74, gap=30, r=14, look=(2, 3), delay=1.6)}
  <path d="M116 108 Q130 120 144 108" stroke="#7DD87A" stroke-width="6" stroke-linecap="round" fill="none"/>
  <rect class="type" x="66" y="40" width="34" height="6" rx="3" fill="#7DD87A"/><rect class="type b" x="104" y="40" width="20" height="6" rx="3" fill="#FFD43B"/>
  <path d="M18 168 L242 168 L226 206 L34 206 Z" fill="#9AA5B1"/>
  <path d="M18 168 L242 168 L238 178 L22 178 Z" fill="#C5CDD6"/>
  <rect x="104" y="184" width="52" height="10" rx="5" fill="#7F8A96"/>
  <path d="M40 170 L20 130" stroke="#4FB8F5" stroke-width="14" stroke-linecap="round"/>
  <g class="wave"><path d="M220 170 L244 120" stroke="#4FB8F5" stroke-width="14" stroke-linecap="round"/>
  <circle cx="246" cy="114" r="12" fill="#4FB8F5"/></g>
  </g>''', view='0 -10 260 250')

milk = svg(160, 240, '''
  .arm { transform-box: view-box; animation: cheer 1.2s ease-in-out infinite; }
  .arm.l { transform-origin: 28px 160px; }
  .arm.r { transform-origin: 132px 160px; animation-delay: 0.6s; }
  @keyframes cheer { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-22deg); } }
  .arm.r { animation-name: cheer-r; }
  @keyframes cheer-r { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(22deg); } }
  .body { animation-duration: 1.2s; }''', f'''
  <ellipse cx="80" cy="230" rx="56" ry="8" fill="#000" opacity="0.08"/>
  <g class="body">
  <path class="arm l" d="M28 160 L6 140" stroke="#E6EEF5" stroke-width="12" stroke-linecap="round"/><path class="arm r" d="M132 160 L154 138" stroke="#E6EEF5" stroke-width="12" stroke-linecap="round"/>
  <path d="M28 70 L80 30 L132 70 L132 220 Q132 228 124 228 L36 228 Q28 228 28 220 Z" fill="#E6EEF5"/>
  <path d="M28 70 L80 30 L132 70 L132 214 Q132 222 124 222 L36 222 Q28 222 28 214 Z" fill="#FFFFFF"/>
  <path d="M28 70 L80 30 L80 48 L28 86 Z" fill="#E6EEF5"/>
  <rect x="64" y="12" width="32" height="24" rx="4" fill="#4FB8F5"/>
  <rect x="28" y="150" width="104" height="44" fill="#4FB8F5"/>
  <rect x="28" y="186" width="104" height="8" fill="#2B93CF"/>
  {eyes(80, 112, gap=22, r=11, delay=2.6)}
  <ellipse cx="50" cy="132" rx="9" ry="5" fill="#FFB3C0"/><ellipse cx="110" cy="132" rx="9" ry="5" fill="#FFB3C0"/>
  <path d="M72 130 Q80 138 88 130" stroke="#3B2A1F" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>''', view='-6 0 172 240')

# 반죽이: mascot-solo.svg 그림을 그대로 쓰고 움직일 부분에 이름을 붙인다.
# 접시 위 쿠키는 사이트 기본 쿠키 그림(design/cookies/plain.svg)을 그대로 넣는다. (접시와 함께 움직이고, 가끔 톡 튀어 오른다)
import re
_plain = open(os.path.join(HERE, '..', 'cookies', 'plain.svg')).read()
_view = re.search(r'viewBox="([^"]+)"', _plain).group(1)
_inner = re.sub(r'^<svg[^>]*>|</svg>\s*$', '', _plain.strip()).replace('id="', 'id="dough-')
_inner = re.sub(r'url\(#', 'url(#dough-', _inner)
PLATE_COOKIE = f'<g class="hop"><svg x="268" y="350" width="64" height="72" viewBox="{_view}">{_inner}</svg></g>'
dough = svg(340, 452, '''
  .body { animation: breathe 3s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.025, 0.975); } }
  .hat { transform-box: fill-box; transform-origin: 50% 100%; animation: hat 3s ease-in-out infinite; }
  @keyframes hat { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-4deg); } 60% { transform: rotate(3deg); } }
  .pupils { animation: look 6s ease-in-out infinite; }
  @keyframes look { 0%, 20%, 100% { transform: translate(0, 0); } 30%, 45% { transform: translate(-7px, -2px); } 55%, 75% { transform: translate(7px, -2px); } }
  .plate { transform-box: fill-box; transform-origin: center; animation: plate 3s ease-in-out infinite 0.4s; }
  @keyframes plate { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .hop { transform-box: fill-box; transform-origin: 50% 100%; animation: hop 3s ease-in-out infinite 1.2s; }
  @keyframes hop { 0%, 55%, 100% { transform: translateY(0) rotate(0); } 68% { transform: translateY(-16px) rotate(-10deg); } 80% { transform: translateY(0) rotate(3deg); } 86% { transform: scale(1.06, 0.94); } }''', '''
  <ellipse cx="300" cy="490" rx="150" ry="16" fill="#000" opacity="0.08"/>
  <g class="body">
    <path d="M150 360c0-110 66-170 150-170s150 60 150 170c0 80-60 126-150 126S150 440 150 360z" fill="#FFE2B0"/>
    <path d="M150 360c0 80 60 126 150 126s150-46 150-126c0 30-50 96-150 96s-150-66-150-96z" fill="#F3C988"/>
    <g class="hat">
      <rect x="214" y="168" width="172" height="44" rx="16" fill="#FFFFFF"/>
      <rect x="214" y="196" width="172" height="16" rx="8" fill="#EDE4D6"/>
      <circle cx="232" cy="140" r="42" fill="#FFFFFF"/>
      <circle cx="300" cy="112" r="54" fill="#FFFFFF"/>
      <circle cx="368" cy="140" r="42" fill="#FFFFFF"/>
      <path d="M200 150c6 20 22 30 40 30h120c18 0 34-10 40-30 0 26-18 40-40 40H240c-22 0-40-14-40-40z" fill="#EDE4D6"/>
    </g>
    <g class="eyes" style="animation-delay:3.2s">
      <ellipse cx="256" cy="292" rx="30" ry="36" fill="#FFFFFF"/>
      <ellipse cx="344" cy="292" rx="30" ry="36" fill="#FFFFFF"/>
      <g class="pupils">
        <ellipse cx="262" cy="300" rx="16" ry="20" fill="#4B3621"/>
        <ellipse cx="338" cy="300" rx="16" ry="20" fill="#4B3621"/>
        <circle cx="268" cy="292" r="6" fill="#FFFFFF"/>
        <circle cx="344" cy="292" r="6" fill="#FFFFFF"/>
      </g>
    </g>
    <ellipse cx="214" cy="340" rx="20" ry="12" fill="#FFB3C0"/>
    <ellipse cx="386" cy="340" rx="20" ry="12" fill="#FFB3C0"/>
    <path d="M272 344q28 34 56 0z" fill="#6B3D17"/>
    <path d="M286 356q14 10 28 0q-6-8-14-8t-14 8z" fill="#FF5C7A"/>
    <g class="plate">
      <ellipse cx="300" cy="420" rx="96" ry="22" fill="#FFFFFF"/>
      <ellipse cx="300" cy="426" rx="96" ry="18" fill="#E9E2D8"/>
      <ellipse cx="300" cy="418" rx="72" ry="13" fill="#FFFFFF"/>
      <ellipse cx="200" cy="418" rx="26" ry="20" fill="#FFE2B0"/>
      <ellipse cx="400" cy="418" rx="26" ry="20" fill="#FFE2B0"/>
      ''' + PLATE_COOKIE + '''
    </g>
  </g>''', view='130 48 340 452')

for name, text in {'oven': oven, 'laptop': laptop, 'milk': milk, 'dough': dough}.items():
    open(os.path.join(HERE, f'{name}.svg'), 'w').write(text)
print('ok: oven, laptop, milk, dough')
