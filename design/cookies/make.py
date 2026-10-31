# 듀오링고 캐릭터식 벡터 포춘쿠키 v3: 얼굴 없음, 큰 면 + 그림자 한 단계 + 하이라이트 하나
# 실루엣은 사용자가 그린 픽셀 쿠키(앞 조각 + 뒤 날개)를 따른다.
# 장식도 같은 규칙: 큰 도형 하나 + 어두운 면 하나.

W, H = 240, 240
FRONT = "M120 12 C78 10 30 40 14 84 C2 118 12 160 42 188 C64 208 96 220 124 216 C140 214 146 204 144 194 C142 168 136 144 128 114 C120 84 112 58 114 36 C115 24 118 16 120 12 Z"
BACK = "M120 12 C154 16 196 48 212 88 C222 112 222 138 210 152 C196 166 168 166 146 156 C130 132 116 106 108 80 C102 58 104 32 120 12 Z"
FOLD = "M128 118 C136 140 142 160 146 158 C152 152 150 140 146 132 Z"  # 앞 조각 뒤로 보이는 접힌 안쪽

def cookie(p, under="", back_extra="", front_extra="", over="", mid=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="260" height="290" viewBox="-10 -50 260 290">
  <defs>
    <clipPath id="cf"><path d="{FRONT}"/></clipPath>
    <clipPath id="cb"><path d="{BACK}"/></clipPath>
  </defs>
  {under}
  <g id="back">
    <path d="{BACK}" fill="{p['back']}"/>
    <g clip-path="url(#cb)">
      <path d="M100 150 C140 176 190 170 232 130 L232 240 L100 240 Z" fill="{p['back_shade']}"/>
      {back_extra}
    </g>
  </g>
  <path id="fold" d="{FOLD}" fill="{p['fold']}"/>
  {mid}
  <g id="front">
    <path d="{FRONT}" fill="{p['base']}"/>
    <g clip-path="url(#cf)">
      <path d="M0 150 C40 196 110 206 160 170 L160 240 L0 240 Z" fill="{p['shade']}"/>
      {front_extra}
    </g>
    <path d="M44 74 C56 52 78 38 98 34" stroke="{p['hi']}" stroke-width="12" stroke-linecap="round" fill="none"/>
  </g>
  {over}
</svg>'''

P = {
    'plain':   dict(base="#F5B041", shade="#E0912A", back="#E39A30", back_shade="#C97D1E", fold="#9E5A14", hi="#FFD98A"),
    'choco':   dict(base="#8A4F2B", shade="#6E3B1F", back="#74401F", back_shade="#5C3016", fold="#3A1D0C", hi="#B57A50"),
    'matcha':  dict(base="#9CC452", shade="#7EA63C", back="#86AE3F", back_shade="#6C9230", fold="#46621B", hi="#D3EB8F"),
    'gold':    dict(base="#FFC91F", shade="#F0A800", back="#F2B300", back_shade="#D99500", fold="#A36C00", hi="#FFF0A0"),
    'cream':   dict(base="#F9DDB0", shade="#EAC08A", back="#EECB94", back_shade="#D9AD70", fold="#AE7838", hi="#FFF6E4"),
    'pumpkin': dict(base="#FF8A1F", shade="#E86E0C", back="#EE7A12", back_shade="#D06208", fold="#8F3E00", hi="#FFC27A"),
    'snow':    dict(base="#F4F8FC", shade="#D8E4EE", back="#E4EDF5", back_shade="#C9D7E3", fold="#8EA3B5", hi="#FFFFFF"),
    'red':     dict(base="#F2504D", shade="#D63A3B", back="#DD4243", back_shade="#BE2F33", fold="#86202A", hi="#FF9C94"),
}

SPARK = lambda x, y, s, c: f'<path d="M{x} {y-s} C{x+s*0.2} {y-s*0.2} {x+s*0.2} {y-s*0.2} {x+s} {y} C{x+s*0.2} {y+s*0.2} {x+s*0.2} {y+s*0.2} {x} {y+s} C{x-s*0.2} {y+s*0.2} {x-s*0.2} {y+s*0.2} {x-s} {y} C{x-s*0.2} {y-s*0.2} {x-s*0.2} {y-s*0.2} {x} {y-s} Z" fill="{c}"/>'

ART = {
    'plain': cookie(P['plain']),
    'choco': cookie(P['choco'], front_extra='<circle cx="62" cy="128" r="7" fill="#5C3016"/><circle cx="92" cy="100" r="6" fill="#5C3016"/><circle cx="80" cy="160" r="6" fill="#5C3016"/>'),
    'matcha': cookie(P['matcha']),
    'gold': cookie(P['gold'], over=SPARK(26, 30, 16, '#FFC91F') + SPARK(214, 196, 13, '#FFC91F') + SPARK(206, 40, 8, '#F0A800')),
    'cat': cookie(P['cream'], under='''
      <path d="M36 66 L46 8 L96 40 Z" fill="#F9DDB0"/><path d="M50 50 L56 24 L80 40 Z" fill="#FF9DB0"/>
      <path d="M160 34 L206 6 L210 66 Z" fill="#EECB94"/><path d="M174 36 L200 20 L202 50 Z" fill="#FF9DB0"/>'''),
    'dog': cookie(P['cream'], front_extra='<ellipse cx="66" cy="150" rx="26" ry="20" fill="#E3A15F"/>', over='''
      <path d="M38 40 C14 44 0 78 6 112 C10 128 26 132 34 118 C40 96 46 70 58 48 Z" fill="#8A5A34"/>
      <path d="M190 54 C214 58 230 88 226 116 C224 130 210 134 202 122 C198 104 192 82 182 64 Z" fill="#74492A"/>'''),
    'rabbit': cookie(P['cream'], under='''
      <path d="M56 56 C42 20 46 -40 68 -42 C90 -42 92 16 88 56 Z" fill="#F9DDB0"/><path d="M62 46 C54 16 58 -28 68 -30 C78 -30 80 16 78 46 Z" fill="#FF9DB0"/>
      <path d="M146 34 C140 0 160 -40 182 -36 C204 -30 192 10 174 46 Z" fill="#EECB94"/><path d="M154 30 C152 4 166 -24 180 -24 C192 -20 184 8 172 36 Z" fill="#FF9DB0"/>'''),
    'pumpkin': cookie(P['pumpkin'], front_extra='<path d="M70 20 C56 70 56 150 80 230" stroke="#E86E0C" stroke-width="10" fill="none"/>', back_extra='<path d="M168 30 C182 70 184 120 176 170" stroke="#D06208" stroke-width="9" fill="none"/>',
                      over='<path d="M114 16 C112 4 118 -2 128 -2 L132 6 C124 8 122 12 124 20 Z" fill="#3F7A24"/><path d="M126 6 C136 -6 156 -4 162 6 C150 12 138 12 126 6 Z" fill="#7FC24A"/>'),
    'snowman': cookie(P['snow'], front_extra='<path d="M0 160 C40 176 100 180 160 160 L160 186 C100 204 40 200 0 186 Z" fill="#E8484A"/>',
                      over='''<path d="M70 36 L76 -6 L156 -6 L160 30 Z" fill="#33393F"/><path d="M58 30 C90 22 140 20 172 28 L170 42 C138 34 92 36 60 44 Z" fill="#23282D"/>
      <path d="M74 14 L156 12 L157 22 L75 25 Z" fill="#E8484A"/><path d="M86 196 L110 196 L106 232 L84 230 Z" fill="#E8484A"/><path d="M86 220 L106 222 L106 232 L84 230 Z" fill="#C2333A"/>'''),
    'deer': cookie(P['cream'], under='''
      <path d="M62 54 L52 6 L32 -20 M52 6 L72 -24 M54 26 L24 14" stroke="#8A5A34" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M166 42 L186 -4 L180 -30 M186 -4 L212 -18 M178 18 L214 14" stroke="#74492A" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>''',
                   over='<path d="M58 176 C70 162 86 162 96 176 C106 162 122 162 134 176 C122 190 106 190 96 178 C86 190 70 190 58 176 Z" fill="#E8484A"/><circle cx="96" cy="194" r="11" fill="#FFC91F"/><path d="M86 196 A11 11 0 0 0 106 196 Z" fill="#E0A100"/>'),
    'santa': cookie(P['red'], front_extra='<path d="M0 166 C40 182 100 186 160 168 L160 240 L0 240 Z" fill="#FFFFFF"/>', back_extra='<path d="M120 150 C150 160 196 156 232 136 L232 240 L120 240 Z" fill="#FFFFFF"/>',
                    over='''<path d="M56 46 C66 10 118 -6 160 12 C188 24 206 50 210 78 L190 76 C182 52 162 38 140 36 C116 34 90 44 72 58 Z" fill="#F2504D"/>
      <path d="M44 50 C80 28 150 22 190 42 L186 64 C148 46 86 50 52 72 Z" fill="#FFFFFF"/><circle cx="212" cy="84" r="15" fill="#FFFFFF"/>'''),
}

SLIP = '''<g id="slip" transform="rotate(14 150 160)">
    <rect x="112" y="146" width="118" height="34" rx="6" fill="#FFFFFF"/>
    <rect x="112" y="170" width="118" height="10" rx="5" fill="#E9E4DC"/>
    <rect x="146" y="156" width="64" height="5" rx="2.5" fill="#F2504D"/>
  </g>'''
ART['plain-open'] = cookie(P['plain'], mid=SLIP)
for name, svg in ART.items():
    open(f'{name}.svg', 'w').write(svg)
print(len(ART), 'cookies')
