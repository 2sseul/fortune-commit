# 빵집 캐릭터들 (듀오링고식: 큰 도형 + 그림자 한 단계 + 큰 눈)
#   oven   : 오븐이  - 0시에 쿠키를 굽는 친구 (창 안에 닫힌 쿠키)
#   laptop : 커밋이  - 커밋·push 담당 (화면이 얼굴)
#   milk   : 우유    - 쿠키 짝꿍, 응원 담당
# 쿠키에는 얼굴을 넣지 않지만 캐릭터는 반죽이처럼 눈이 있다.
import os
HERE = os.path.dirname(os.path.abspath(__file__))

def eyes(cx, cy, gap=26, r=13, look=(3, 4)):
    lx, ly = look
    return (f'<ellipse cx="{cx-gap}" cy="{cy}" rx="{r}" ry="{r*1.15}" fill="#FFFFFF"/>'
            f'<ellipse cx="{cx+gap}" cy="{cy}" rx="{r}" ry="{r*1.15}" fill="#FFFFFF"/>'
            f'<ellipse cx="{cx-gap+lx}" cy="{cy+ly}" rx="{r*0.55}" ry="{r*0.65}" fill="#3B2A1F"/>'
            f'<ellipse cx="{cx+gap+lx}" cy="{cy+ly}" rx="{r*0.55}" ry="{r*0.65}" fill="#3B2A1F"/>'
            f'<circle cx="{cx-gap+lx+3}" cy="{cy+ly-4}" r="{r*0.22}" fill="#FFFFFF"/>'
            f'<circle cx="{cx+gap+lx+3}" cy="{cy+ly-4}" r="{r*0.22}" fill="#FFFFFF"/>')

COOKIE = ('<g id="cookie">'
          '<path d="M20 2 C34 2 44 14 44 26 C44 36 36 40 30 38 C28 30 26 20 22 12 C20 8 18 4 20 2 Z" fill="#E39A30"/>'
          '<path d="M20 2 C8 2 0 14 0 28 C0 40 10 46 22 44 C26 43 28 40 28 36 C26 26 22 14 20 2 Z" fill="#F5B041"/>'
          '<path d="M0 34 C6 42 16 46 28 40 L28 46 L0 46 Z" fill="#E0912A" opacity="0.8"/>'
          '<path d="M6 16 C9 10 14 6 18 6" stroke="#FFD98A" stroke-width="4" stroke-linecap="round" fill="none"/></g>')

oven = f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="260" viewBox="0 0 240 260">
  <ellipse cx="120" cy="248" rx="86" ry="10" fill="#000" opacity="0.08"/>
  <rect x="44" y="228" width="26" height="22" rx="8" fill="#B5332A"/><rect x="170" y="228" width="26" height="22" rx="8" fill="#B5332A"/>
  <rect x="24" y="40" width="192" height="196" rx="40" fill="#E8483C"/>
  <rect x="24" y="28" width="192" height="196" rx="40" fill="#FF6B5B"/>
  <rect x="44" y="44" width="152" height="54" rx="20" fill="#FF8C7E"/>
  {eyes(120, 70, gap=30, r=14)}
  <circle cx="64" cy="58" r="0" fill="none"/>
  <rect x="48" y="112" width="144" height="94" rx="22" fill="#5C2A24"/>
  <rect x="56" y="120" width="128" height="78" rx="16" fill="#FFB347"/>
  <rect x="56" y="120" width="128" height="78" rx="16" fill="#FFD27A" opacity="0.6"/>
  <g transform="translate(96 136)">{COOKIE}</g>
  <path d="M64 130 L80 122" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  <rect x="88" y="208" width="64" height="10" rx="5" fill="#B5332A"/>
  <path d="M14 150 C2 150 0 130 12 126" stroke="#E8483C" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path d="M226 150 C238 150 240 130 228 126" stroke="#E8483C" stroke-width="14" stroke-linecap="round" fill="none"/>
</svg>'''

laptop = f'''<svg xmlns="http://www.w3.org/2000/svg" width="260" height="240" viewBox="0 0 260 240">
  <ellipse cx="130" cy="228" rx="100" ry="10" fill="#000" opacity="0.08"/>
  <rect x="40" y="20" width="180" height="140" rx="22" fill="#2B93CF"/>
  <rect x="40" y="14" width="180" height="140" rx="22" fill="#4FB8F5"/>
  <rect x="54" y="28" width="152" height="112" rx="14" fill="#1E2A38"/>
  {eyes(130, 74, gap=30, r=14, look=(2, 3))}
  <path d="M116 108 Q130 120 144 108" stroke="#7DD87A" stroke-width="6" stroke-linecap="round" fill="none"/>
  <rect x="66" y="40" width="34" height="6" rx="3" fill="#7DD87A"/><rect x="104" y="40" width="20" height="6" rx="3" fill="#FFD43B"/>
  <path d="M18 168 L242 168 L226 206 L34 206 Z" fill="#9AA5B1"/>
  <path d="M18 168 L242 168 L238 178 L22 178 Z" fill="#C5CDD6"/>
  <rect x="104" y="184" width="52" height="10" rx="5" fill="#7F8A96"/>
  <path d="M40 170 L20 130" stroke="#4FB8F5" stroke-width="14" stroke-linecap="round"/>
  <path d="M220 170 L244 120" stroke="#4FB8F5" stroke-width="14" stroke-linecap="round"/>
  <circle cx="246" cy="114" r="12" fill="#4FB8F5"/>
</svg>'''

milk = f'''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240" viewBox="0 0 160 240">
  <ellipse cx="80" cy="230" rx="56" ry="8" fill="#000" opacity="0.08"/>
  <path d="M28 70 L80 30 L132 70 L132 220 Q132 228 124 228 L36 228 Q28 228 28 220 Z" fill="#E6EEF5"/>
  <path d="M28 70 L80 30 L132 70 L132 214 Q132 222 124 222 L36 222 Q28 222 28 214 Z" fill="#FFFFFF"/>
  <path d="M28 70 L80 30 L80 48 L28 86 Z" fill="#E6EEF5"/>
  <rect x="64" y="12" width="32" height="24" rx="4" fill="#4FB8F5"/>
  <rect x="28" y="150" width="104" height="44" fill="#4FB8F5"/>
  <rect x="28" y="186" width="104" height="8" fill="#2B93CF"/>
  {eyes(80, 112, gap=22, r=11)}
  <ellipse cx="50" cy="132" rx="9" ry="5" fill="#FFB3C0"/><ellipse cx="110" cy="132" rx="9" ry="5" fill="#FFB3C0"/>
  <path d="M72 130 Q80 138 88 130" stroke="#3B2A1F" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M28 160 L6 140" stroke="#E6EEF5" stroke-width="12" stroke-linecap="round"/><path d="M132 160 L154 138" stroke="#E6EEF5" stroke-width="12" stroke-linecap="round"/>
</svg>'''

for name, svg in {'oven': oven, 'laptop': laptop, 'milk': milk}.items():
    open(os.path.join(HERE, f'{name}.svg'), 'w').write(svg)
print('ok')
