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

# ---- v3 새 쿠키 후보 ----
P.update({
    'owl':    dict(base="#4A5A9C", shade="#3A4783", back="#3F4E8C", back_shade="#313D72", fold="#1F2650", hi="#8C9BD8"),
    'sky':    dict(base="#7CCBF2", shade="#5AB2E0", back="#66BCE8", back_shade="#4DA2D2", fold="#2B76A3", hi="#C8EBFF"),
    'merge':  dict(base="#F5B041", shade="#E0912A", hi="#FFD98A", back="#74401F", back_shade="#5C3016", fold="#3A1D0C"),
    'fire':   dict(base="#FF6A3D", shade="#E84E26", back="#F05A30", back_shade="#D1421E", fold="#8C2410", hi="#FFB08A"),
    'crab':   dict(base="#F26B3A", shade="#D9532A", back="#E15D30", back_shade="#C44822", fold="#7E2A0E", hi="#FFAE88"),
    'python': dict(base="#3B78C2", shade="#2E62A3", hi="#8DB8EE", back="#FFD43B", back_shade="#E8B820", fold="#8E6A00"),
    'coffee': dict(base="#E2B27A", shade="#CC965C", back="#D6A36A", back_shade="#BD8A50", fold="#7A4E22", hi="#F8DDB6"),
    'burnt':  dict(base="#4A3328", shade="#38261D", back="#3E2B21", back_shade="#2E1F18", fold="#160D09", hi="#7A5A48"),
    'rainbow':dict(base="#FFFFFF", shade="#F0F0F0", back="#F5F5F5", back_shade="#E6E6E6", fold="#9A86C8", hi="#FFFFFF"),
    'sakura': dict(base="#FFC2D4", shade="#F5A3BC", back="#FAB2C8", back_shade="#EC93AE", fold="#B85A7A", hi="#FFE6EE"),
    'melon':  dict(base="#FF5F6D", shade="#E84858", back="#F05262", back_shade="#D63D4E", fold="#8E1F2C", hi="#FFA3AC"),
    'maple':  dict(base="#F28A2E", shade="#DB6F1A", back="#E57B22", back_shade="#C96214", fold="#83380A", hi="#FFC48A"),
    'bug':    dict(base="#E8413C", shade="#CC2F2C", back="#D93733", back_shade="#BC2826", fold="#6E1210", hi="#FF8C86"),
    'galaxy': dict(base="#5B3FA8", shade="#4A2F8F", back="#4F3599", back_shade="#3D2780", fold="#1E1245", hi="#9C85E8"),
})
DOTS = lambda pts, r, c: ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y in pts)
STRIPES = lambda colors, w: ''.join(f'<rect x="{-60 + i * w}" y="-40" width="{w}" height="340" transform="rotate(-24 120 120)" fill="{c}"/>' for i, c in enumerate(colors))

ART.update({
    # 올빼미: 남색 밤 쿠키 + 깃털 귀 + 초승달
    'owl': cookie(P['owl'], under='<path d="M40 60 L36 6 L86 40 Z" fill="#4A5A9C"/><path d="M168 36 L208 0 L212 62 Z" fill="#3F4E8C"/>',
                  over='<path d="M214 168 A22 22 0 1 1 196 136 A17 17 0 1 0 214 168 Z" fill="#FFD43B"/>' + SPARK(30, 196, 9, '#FFD43B')),
    # 주말: 하늘색 + 머리 위 선글라스
    'weekend': cookie(P['sky'], over='<ellipse cx="128" cy="34" rx="92" ry="20" transform="rotate(-8 128 34)" fill="#F2C766"/><ellipse cx="128" cy="40" rx="92" ry="12" transform="rotate(-8 128 40)" fill="#D9A93E"/><path d="M84 32 C84 0 106 -16 130 -16 C154 -16 172 -2 172 24 Z" fill="#F7D57E"/><path d="M84 26 C110 18 146 14 172 18 L172 28 C146 24 110 28 84 36 Z" fill="#FF5C7A"/>'),
    # 머지: 앞은 기본, 뒤는 초코
    'merge': cookie(P['merge'], over='<circle cx="198" cy="192" r="24" fill="#8E5BD8"/><path d="M190 180 v24 M190 186 c0 10 16 6 16 18" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="190" cy="178" r="4" fill="#FFFFFF"/><circle cx="206" cy="206" r="4" fill="#FFFFFF"/>'),
    # 불꽃: 위에 불꽃
    'streak': cookie(P['fire'], under='<path d="M108 30 C96 0 110 -26 128 -40 C126 -20 146 -12 148 6 C150 18 144 28 136 34 Z" fill="#FF9600"/><path d="M118 30 C114 12 120 -4 128 -12 C130 0 140 6 138 18 C136 26 130 30 126 32 Z" fill="#FFD43B"/>'),
    # 게(Rust): 양옆 집게발
    'crab': cookie(P['crab'], over='<g transform="translate(-4 -6) rotate(-14 22 88) scale(1 1)"><path d="M22 108 L38 132" stroke="#C44822" stroke-width="12" stroke-linecap="round"/><path d="M0 88 C-6 64 12 48 30 52 L22 74 L44 66 C52 86 42 108 22 112 C10 114 2 104 0 88 Z" fill="#C93A1E"/><path d="M22 112 C10 114 2 104 0 88 C8 100 20 104 34 102 C30 108 26 111 22 112 Z" fill="#C44822"/></g><g transform="translate(244 0) rotate(-14 22 88) scale(-1 1)"><path d="M22 108 L38 132" stroke="#B23E1C" stroke-width="12" stroke-linecap="round"/><path d="M0 88 C-6 64 12 48 30 52 L22 74 L44 66 C52 86 42 108 22 112 C10 114 2 104 0 88 Z" fill="#B5331A"/><path d="M22 112 C10 114 2 104 0 88 C8 100 20 104 34 102 C30 108 26 111 22 112 Z" fill="#B23E1C"/></g>'),
    # 파이썬: 앞 파랑, 뒤 노랑
    'python': cookie(P['python']),
    # 커피(Java): 위쪽 커피 글레이즈 + 김
    'coffee': cookie(P['coffee'], front_extra='<path d="M0 0 L160 0 L160 70 C130 92 110 70 90 88 C70 104 50 84 30 96 C14 104 4 92 0 86 Z" fill="#6B3D1E"/>', back_extra='<path d="M100 0 L240 0 L240 88 C220 98 204 84 186 94 C168 104 150 86 130 92 L100 92 Z" fill="#5A3218"/>',
                    over='<path d="M92 -6 c-12 -14 10 -22 0 -38 M122 -6 c-12 -14 10 -22 0 -38" stroke="#D9CFC4" stroke-width="7" stroke-linecap="round" fill="none"/>'),
    # 탄 쿠키: 까맣게 + 연기
    'burnt': cookie(P['burnt'], front_extra=DOTS([(60, 120), (94, 150), (80, 90)], 6, '#1E140F'),
                    over='<circle cx="100" cy="-6" r="16" fill="#9A9A9A" opacity="0.7"/><circle cx="122" cy="-22" r="20" fill="#B5B5B5" opacity="0.7"/><circle cx="150" cy="-12" r="14" fill="#9A9A9A" opacity="0.7"/>'),
    # 무지개: 대각선 줄무늬
    'rainbow': cookie(P['rainbow'], front_extra=STRIPES(['#FF5C7A', '#FF9F1A', '#FFD43B', '#4CC38A', '#4FB8F5', '#8E5BD8', '#FF5C7A'], 40) + '<path d="M0 150 C40 196 110 206 160 170 L160 240 L0 240 Z" fill="#000000" opacity="0.10"/>',
                     back_extra=STRIPES(['#E8486A', '#E88A0C', '#E8BE28', '#36AA74', '#3AA0DB', '#7646C0', '#E8486A'], 40) + '<path d="M100 150 C140 176 190 170 232 130 L232 240 L100 240 Z" fill="#000000" opacity="0.10"/>'),
    # 벚꽃: 분홍 + 꽃잎
    'sakura': cookie(P['sakura'], over=''.join(f'<g transform="translate({x} {y}) rotate({r})"><ellipse cx="0" cy="-9" rx="7" ry="10" fill="#FFFFFF"/><ellipse cx="9" cy="-2" rx="7" ry="10" transform="rotate(72)" fill="#FFFFFF"/><ellipse cx="5" cy="8" rx="7" ry="10" transform="rotate(144)" fill="#FFFFFF"/><ellipse cx="-5" cy="8" rx="7" ry="10" transform="rotate(216)" fill="#FFFFFF"/><ellipse cx="-9" cy="-2" rx="7" ry="10" transform="rotate(288)" fill="#FFFFFF"/><circle r="4" fill="#FF8FB0"/></g>' for x, y, r in [(32, 30, 10), (210, 186, -20), (196, 26, 30)])),
    # 수박: 빨강 + 초록 껍질 + 씨
    'watermelon': cookie(P['melon'], front_extra='<path d="M0 140 C40 186 110 196 160 160 L160 240 L0 240 Z" fill="#FFFFFF" opacity="0.9"/><path d="M0 154 C40 200 110 210 160 174 L160 240 L0 240 Z" fill="#4CC38A"/><path d="M0 172 C40 214 110 222 160 190 L160 240 L0 240 Z" fill="#2F9C68"/>' + DOTS([(60, 110), (90, 80), (86, 136), (52, 70)], 5, '#3B1E14'),
                         back_extra='<path d="M100 132 C140 166 190 158 232 116 L232 240 L100 240 Z" fill="#FFFFFF" opacity="0.9"/><path d="M100 144 C140 176 190 168 232 126 L232 240 L100 240 Z" fill="#36AA74"/><path d="M100 160 C140 188 190 182 232 142 L232 240 L100 240 Z" fill="#2A8A5C"/>' + DOTS([(168, 90), (186, 120)], 5, '#3B1E14')),
    # 단풍: 주황 + 단풍잎
    'maple': cookie(P['maple'], over='<path d="M200 150 l6 -16 l6 12 l12 -6 l-4 14 l14 4 l-12 8 l6 10 l-14 -2 l-2 14 l-8 -12 l-8 12 l-2 -14 l-14 2 l6 -10 l-12 -8 l14 -4 l-4 -14 l12 6 z" fill="#D93E2B"/><path d="M206 172 v22" stroke="#8E2A1A" stroke-width="4" stroke-linecap="round"/>'),
    # 버그: 무당벌레 무늬 + 더듬이
    'bug': cookie(P['bug'], under='<path d="M84 30 C76 8 62 -6 46 -10 M134 26 C144 4 160 -8 176 -10" stroke="#2D2D2D" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="44" cy="-12" r="8" fill="#2D2D2D"/><circle cx="178" cy="-12" r="8" fill="#2D2D2D"/>',
                  front_extra=DOTS([(58, 90), (92, 130), (52, 150), (98, 70)], 11, '#2D2D2D'), back_extra=DOTS([(176, 90), (190, 130)], 10, '#2D2D2D')),
    # 은하수: 보라 우주 + 별
    'galaxy': cookie(P['galaxy'], front_extra=DOTS([(50, 110), (86, 150), (96, 90), (64, 170)], 2.5, '#FFFFFF') + '<ellipse cx="80" cy="120" rx="70" ry="22" transform="rotate(-30 80 120)" fill="#8E6BE8" opacity="0.45"/>',
                     back_extra=DOTS([(170, 80), (186, 124), (160, 140)], 2.5, '#FFFFFF'), over=SPARK(30, 26, 14, '#FFD43B') + SPARK(212, 188, 10, '#FFFFFF')),
})
# ---- 언어 쿠키 추가 (색 + 상징 도형 하나, 얼굴·글자 없음) ----
P.update({
    'js':      dict(base="#F7DF1E", shade="#E3C800", back="#EBCF0A", back_shade="#D1B600", fold="#8A7600", hi="#FFF59A"),
    'ts':      dict(base="#3178C6", shade="#2763A8", back="#2B6CB5", back_shade="#215995", fold="#123966", hi="#86B6EC"),
    'go':      dict(base="#29BEDF", shade="#14A4C4", back="#1CB1D2", back_shade="#0E94B2", fold="#05607A", hi="#A6EAF8"),
    'kotlin':  dict(base="#7F52FF", shade="#6A3EE6", back="#F88909", back_shade="#DB7300", fold="#5A2DB8", hi="#C4ADFF"),
    'swift':   dict(base="#F05138", shade="#D63E28", back="#E4472F", back_shade="#C93622", fold="#7E1E10", hi="#FFA190"),
    'cpp':     dict(base="#00599C", shade="#004A82", back="#00508D", back_shade="#004072", fold="#00284A", hi="#5C9ED6"),
    'csharp':  dict(base="#7B3FB5", shade="#66309C", back="#6E36A6", back_shade="#5A2A8A", fold="#33155A", hi="#C29AF0"),
    'ruby':    dict(base="#D2362F", shade="#B42822", back="#C22F28", back_shade="#A1221D", fold="#5E0F0B", hi="#FF8E86"),
    'php':     dict(base="#8A8FD0", shade="#7378BC", back="#7D82C4", back_shade="#676CAE", fold="#3E4280", hi="#C8CBF2"),
    'dart':    dict(base="#13B9FD", shade="#0AA0E0", back="#0F9FE0", back_shade="#0886C2", fold="#03507A", hi="#9DE3FF"),
    'shell':   dict(base="#34383D", shade="#25282C", back="#2B2F33", back_shade="#1E2125", fold="#0E1012", hi="#6C737A"),
    'haskell': dict(base="#5E5086", shade="#4C406F", back="#53467A", back_shade="#423762", fold="#251D3A", hi="#A898D8"),
})
W8 = 'stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"'
ART.update({
    'javascript': cookie(P['js'], front_extra='<path d="M58 88 C46 88 48 102 48 112 C48 120 42 124 36 124 C42 124 48 128 48 136 C48 146 46 160 58 160" stroke="#2D2D2D" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M92 88 C104 88 102 102 102 112 C102 120 108 124 114 124 C108 124 102 128 102 136 C102 146 104 160 92 160" stroke="#2D2D2D" stroke-width="9" stroke-linecap="round" fill="none"/>'),
    'typescript': cookie(P['ts'], front_extra=f'<path d="M64 96 L40 124 L64 152" {W8}/><path d="M90 96 L114 124 L90 152" {W8}/>'),
    'go': cookie(P['go'], under='<path d="M-6 90 H40 M-10 120 H30 M-2 150 H40" stroke="#29BEDF" stroke-width="10" stroke-linecap="round" opacity="0.55"/>'),
    'kotlin': cookie(P['kotlin'], front_extra='<path d="M0 240 L0 130 L110 240 Z" fill="#E44857"/>'),
    'swift': cookie(P['swift'], front_extra='<path d="M30 100 C56 128 92 146 116 140 C104 160 74 168 46 156 C70 158 90 150 98 142 C72 140 46 124 30 100 Z M44 92 C64 112 86 126 106 130 C88 116 68 104 44 92 Z" fill="#FFFFFF"/>'),
    'cpp': cookie(P['cpp'], front_extra=f'<path d="M48 124 H76 M62 110 V138" {W8}/><path d="M86 124 H114 M100 110 V138" {W8}/>'),
    'csharp': cookie(P['csharp'], front_extra=f'<path d="M66 92 L58 156 M90 92 L82 156 M46 112 H106 M42 136 H102" {W8}/>'),
    'ruby': cookie(P['ruby'], front_extra='<path d="M14 84 L70 40 L120 30 L80 110 Z" fill="#E85A50"/><path d="M14 84 L80 110 L40 190 L8 150 Z" fill="#B42822"/><path d="M80 110 L120 30 L132 120 L100 210 Z" fill="#C22F28"/>',
                   back_extra='<path d="M124 20 L210 90 L150 120 Z" fill="#D63A32"/>'),
    'php': cookie(P['php'], over='<path d="M196 64 C236 60 252 104 240 142 C232 166 210 174 196 162 C204 130 204 96 196 64 Z" fill="#9A9EDD"/><path d="M204 84 C228 86 236 112 230 136 C226 150 214 154 206 148 C210 126 210 104 204 84 Z" fill="#F2B6C6"/>'),
    'dart': cookie(P['dart'], over='<path d="M118 96 L232 18" stroke="#2D2D2D" stroke-width="7" stroke-linecap="round"/><path d="M226 10 L246 4 L240 24 L226 30 Z" fill="#FF5C7A"/><path d="M212 26 L232 4 L240 12 L222 34 Z" fill="#FF8FA3"/><circle cx="118" cy="96" r="7" fill="#03507A"/>'),
    'shell': cookie(P['shell'], front_extra='<path d="M40 104 L66 124 L40 144" stroke="#4CE08A" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M76 148 H108" stroke="#4CE08A" stroke-width="10" stroke-linecap="round"/>'),
    'haskell': cookie(P['haskell'], front_extra=f'<path d="M48 92 L64 92 L100 160 M78 122 L54 160" {W8}/>'),
})

# ---- 개발자 밈 쿠키 ----
import os
import re as _re
PL = P['plain']

def body(svg):
    # <svg> 껍데기와 <defs>를 뺀 그림 부분 (쌓기·한 입 베기 같은 조합용)
    inner = _re.sub(r'^<svg[^>]*>|</svg>\s*$', '', svg.strip())
    return _re.sub(r'<defs>.*?</defs>', '', inner, flags=_re.S)

DEFS = f'<defs><clipPath id="cf"><path d="{FRONT}"/></clipPath><clipPath id="cb"><path d="{BACK}"/></clipPath>'
def wrap(content, extra_defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="260" height="290" viewBox="-10 -50 260 290">{DEFS}{extra_defs}</defs>{content}</svg>'

def bite(svg, circles):
    # 원 모양으로 베어 먹은 자리를 투명하게 비운다
    holes = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#000"/>' for x, y, r in circles)
    mask = f'<mask id="bite" maskUnits="userSpaceOnUse" x="-10" y="-50" width="260" height="290"><rect x="-10" y="-50" width="260" height="290" fill="#fff"/>{holes}</mask>'
    return wrap(f'<g mask="url(#bite)">{body(svg)}</g>', mask)

# 잔디: 기여 그래프 칸
GRASS = ''.join(f'<rect x="{x}" y="{y}" width="24" height="24" rx="6" fill="{c}"/>'
                for k, (x, y) in enumerate((x, y) for y in range(4, 240, 30) for x in range(4, 170, 30))
                for c in [['#9BE9A8', '#40C463', '#30A14E', '#216E39', '#9BE9A8', '#40C463'][(k * 5 + k // 4) % 6]])
TEXTURE_BG = '<rect x="-10" y="-10" width="260" height="260" fill="#EBEDF0"/>'

pixel_plain = open('pixel-plain.svg').read()
pixel_inner = _re.sub(r'^<svg[^>]*>|</svg>\s*$', '', pixel_plain.strip())

stack_one = body(cookie(P['plain']))
ART.update({
    'grass': cookie(dict(base="#EBEDF0", shade="#D8DCE0", back="#40C463", back_shade="#30A14E", fold="#1B5E2E", hi="#FFFFFF"),
                    front_extra=GRASS + '<path d="M0 150 C40 196 110 206 160 170 L160 240 L0 240 Z" fill="#000" opacity="0.12"/>'),
    'lgtm': cookie(PL, over='<circle cx="176" cy="176" r="38" fill="#4CC38A"/><circle cx="176" cy="176" r="30" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="6 6"/><path d="M160 178 L172 190 L194 164" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
    'star': cookie(PL, front_extra='<path d="M70 82 L80 106 L106 108 L86 124 L92 150 L70 136 L48 150 L54 124 L34 108 L60 106 Z" fill="#FFD43B"/><path d="M70 136 L48 150 L54 124 L34 108 L60 106 Z" fill="#F0B400" opacity="0.6"/>'),
    'fork': cookie(PL, over='<g transform="rotate(28 170 60)"><rect x="164" y="-30" width="12" height="70" rx="6" fill="#B8BEC6"/><path d="M152 40 h36 v14 a18 18 0 0 1 -36 0 z" fill="#C9CFD6"/><rect x="152" y="54" width="6" height="40" rx="3" fill="#C9CFD6"/><rect x="167" y="54" width="6" height="44" rx="3" fill="#C9CFD6"/><rect x="182" y="54" width="6" height="40" rx="3" fill="#C9CFD6"/></g>'),
    'hotfix': cookie(PL, front_extra='<path d="M40 60 L62 96 L50 120 L74 150 L66 190" stroke="#9E5A14" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                     over='<g transform="rotate(-30 70 120)"><rect x="20" y="104" width="100" height="32" rx="16" fill="#F7D3B0"/><rect x="52" y="104" width="36" height="32" fill="#EDBE96"/><circle cx="62" cy="114" r="2.5" fill="#D9A27A"/><circle cx="78" cy="114" r="2.5" fill="#D9A27A"/><circle cx="62" cy="126" r="2.5" fill="#D9A27A"/><circle cx="78" cy="126" r="2.5" fill="#D9A27A"/></g>'),
    '404': bite(cookie(PL), [(190, 70, 30), (214, 104, 28), (176, 40, 22)]),
    'null': wrap(f'<path d="{BACK}" fill="none" stroke="#AFAFAF" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/><path d="{FRONT}" fill="#FFFFFF" fill-opacity="0.5" stroke="#AFAFAF" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/>'),
    'duck': cookie(PL, over='<g transform="translate(92 -44)"><ellipse cx="44" cy="62" rx="44" ry="26" fill="#FFD43B"/><path d="M0 62 C0 90 88 90 88 62 C88 76 0 76 0 62 Z" fill="#F0B400"/><circle cx="68" cy="30" r="22" fill="#FFD43B"/><path d="M86 30 L106 26 L104 38 L86 38 Z" fill="#FF9600"/><path d="M14 54 C26 44 40 46 48 56" stroke="#F0B400" stroke-width="6" stroke-linecap="round" fill="none"/></g>'),
    'infinite': cookie(PL, front_extra='<path d="M30 124 C30 100 60 100 76 124 C92 148 122 148 122 124 C122 100 92 100 76 124 C60 148 30 148 30 124 Z" stroke="#FFFFFF" stroke-width="11" fill="none" stroke-linejoin="round"/>'),
    'semicolon': cookie(P['plain'], front_extra='<circle cx="76" cy="70" r="19" fill="#5C3016"/><circle cx="76" cy="138" r="19" fill="#5C3016"/><path d="M90 146 C92 168 80 188 60 198" stroke="#5C3016" stroke-width="17" stroke-linecap="round" fill="none"/>'),
    'stackoverflow': wrap(
        f'<g transform="translate(20 150) scale(0.42)">{stack_one}</g>'
        f'<g transform="translate(118 150) scale(0.42)">{stack_one}</g>'
        f'<g transform="translate(70 80) scale(0.42)">{stack_one}</g>'
        f'<g transform="translate(150 0) rotate(24 50 50) scale(0.42)">{stack_one}</g>'
        '<path d="M140 30 c-10 -6 -18 -4 -24 2 M150 52 c-12 -2 -20 2 -24 10" stroke="#AFAFAF" stroke-width="4" stroke-linecap="round" fill="none"/>'),
    'legacy': cookie(dict(base="#D8C3A0", shade="#C2AB86", back="#CDB792", back_shade="#B59F7A", fold="#7A6447", hi="#EFE3CC"),
                     front_extra=DOTS([(50, 100), (90, 140), (70, 170), (100, 90), (40, 150)], 3, '#A08C6E'),
                     over='<path d="M14 84 L60 16 M14 84 L74 60 M14 84 L40 30 M26 66 C34 58 44 54 52 56 M36 50 C44 44 52 42 58 42 M20 76 C30 72 42 70 52 72" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9"/>'),
    'darkmode': cookie(dict(base="#FFE08A", shade="#F5C94A", hi="#FFF4CC", back="#2E3A6E", back_shade="#222C56", fold="#11183A"),
                       over=SPARK(190, 40, 9, '#FFFFFF') + '<path d="M214 160 A20 20 0 1 1 198 132 A15 15 0 1 0 214 160 Z" fill="#FFD43B"/><circle cx="34" cy="24" r="12" fill="#FF9F1A"/>'),
    'keycap': cookie(PL, under='<path d="M-2 60 L242 60 L250 236 L-10 236 Z" fill="#C9CFD6"/><path d="M-10 236 L250 236 L246 250 L-6 250 Z" fill="#A7AEB7"/><rect x="10" y="66" width="220" height="166" rx="16" fill="#E5E8EC"/>'),
    'friday': cookie(dict(base="#F5B041", shade="#E0912A", back="#E39A30", back_shade="#C97D1E", fold="#9E5A14", hi="#FFD98A"),
                     under='<path d="M60 40 C50 10 66 -16 82 -30 C80 -10 96 -6 98 10 C100 22 94 32 86 36 Z M140 30 C132 4 146 -18 160 -30 C158 -12 172 -6 172 8 C174 20 166 28 160 32 Z" fill="#FF6A3D"/><path d="M72 36 C68 20 74 6 82 0 C84 10 92 14 90 24 Z M150 28 C148 16 152 6 160 0 C162 8 168 12 166 22 Z" fill="#FFD43B"/>',
                     over='<g transform="translate(196 120)"><rect x="0" y="16" width="34" height="76" rx="12" fill="#E8484A"/><rect x="0" y="70" width="34" height="22" rx="8" fill="#C2333A"/><rect x="8" y="0" width="18" height="20" rx="4" fill="#2D2D2D"/><path d="M26 6 L44 -4" stroke="#2D2D2D" stroke-width="6" stroke-linecap="round"/></g>'),
    'docker': cookie(dict(base="#2496ED", shade="#1A7FCC", back="#1E88DA", back_shade="#1570B8", fold="#0B4479", hi="#8CCBFA"),
                     under=''.join(f'<rect x="{x}" y="{y}" width="30" height="24" rx="3" fill="{c}"/>' for x, y, c in [(54, 6, '#5BB4F5'), (88, 6, '#4AA8EF'), (122, 6, '#5BB4F5'), (88, -22, '#4AA8EF'), (122, -22, '#5BB4F5')]),
                     over='<path d="M214 150 C236 140 246 118 238 104 C232 116 222 120 214 118 C222 108 224 96 218 86 C206 100 206 124 214 150 Z" fill="#1570B8"/>'),
    'retro': wrap(f'<g transform="translate(-4 4) scale(8.6)" shape-rendering="crispEdges">{pixel_inner}</g>'),
    'helloworld': wrap(f'<g transform="translate(36 70) scale(0.7)">{body(cookie(dict(base="#FFD9A0", shade="#F5BE78", back="#F8C988", back_shade="#E8AD62", fold="#A86A24", hi="#FFF1D8")))}</g>'
                       '<path d="M118 70 C96 50 80 62 92 76 C100 86 112 80 118 70 Z M118 70 C140 50 156 62 144 76 C136 86 124 80 118 70 Z" fill="#FF5C7A"/><circle cx="118" cy="72" r="8" fill="#D93E5D"/>'
                       + SPARK(40, 60, 12, '#FFD43B') + SPARK(206, 100, 9, '#4FB8F5') + SPARK(196, 210, 8, '#FF9F1A')),
})

# ---- 아이템 아이콘 + 뽑기 전용 쿠키 ----
P.update({
    'ice':        dict(base="#F5B041", shade="#E0912A", back="#E39A30", back_shade="#C97D1E", fold="#9E5A14", hi="#FFD98A"),
    'mystery':    dict(base="#B9A6E8", shade="#9C86D6", back="#A891DE", back_shade="#8B73C8", fold="#5A4392", hi="#E4DAFF"),
    'strawberry': dict(base="#FF8FA8", shade="#F26F8E", back="#F87D99", back_shade="#E5607F", fold="#A83455", hi="#FFD0DB"),
    'lemon':      dict(base="#FFE45C", shade="#F5CF2E", back="#F8D83F", back_shade="#E8C220", fold="#9C7F00", hi="#FFF6B8"),
    'blueberry':  dict(base="#7E8FE0", shade="#6474CC", back="#6F80D6", back_shade="#5767BE", fold="#2F3A80", hi="#C2CBF6"),
    'mintchip':   dict(base="#8FE3C8", shade="#6ECFB0", back="#7DD9BC", back_shade="#5FC4A3", fold="#2B7F66", hi="#D6F7EC"),
    'vanilla':    dict(base="#FFF1D6", shade="#F2DDB4", back="#F8E7C4", back_shade="#E9D2A4", fold="#A8875A", hi="#FFFFFF"),
    'sprinkle':   dict(base="#F7C8E0", shade="#EBAACB", back="#F1B8D5", back_shade="#E29CC0", fold="#9E5A7E", hi="#FFE8F3"),
    'macaron':    dict(base="#BFE8D5", shade="#9ED6BE", hi="#E6F8EF", back="#F9C9D9", back_shade="#EEADC2", fold="#8E5C70"),
    'donut':      dict(base="#E8B57A", shade="#D49A5C", back="#DDA86A", back_shade="#C78E50", fold="#7E5226", hi="#F8DDB8"),
    'crystal':    dict(base="#BFEFFF", shade="#93DDF5", back="#A8E6FB", back_shade="#7FD2EE", fold="#3B8FB0", hi="#FFFFFF"),
    'crown':      dict(base="#FFC91F", shade="#F0A800", back="#F2B300", back_shade="#D99500", fold="#A36C00", hi="#FFF0A0"),
})
SPRINKLES = ''.join(f'<rect x="{x}" y="{y}" width="14" height="5" rx="2.5" transform="rotate({r} {x+7} {y+2})" fill="{c}"/>'
                    for x, y, r, c in [(40, 80, 30, '#4FB8F5'), (70, 110, -20, '#FFD43B'), (50, 140, 60, '#4CC38A'), (90, 70, -45, '#FF5C7A'), (96, 150, 15, '#8E5BD8'), (30, 116, -70, '#FF9F1A'), (160, 80, 40, '#FFD43B'), (180, 120, -30, '#4FB8F5'), (150, 130, 70, '#4CC38A')])
ART.update({
    # 냉동 쿠키(아이템): 얼음 큐브 안에 갇힌 쿠키
    'item-freeze': wrap('<g transform="translate(30 20) scale(0.75)">' + body(cookie(P['ice'])) + '</g>'
        '<rect x="0" y="-20" width="240" height="250" rx="34" fill="#CFEFFF" opacity="0.55"/>'
        '<rect x="0" y="-20" width="240" height="250" rx="34" fill="none" stroke="#7FD2EE" stroke-width="10"/>'
        '<path d="M24 0 L80 0 L24 56 Z" fill="#FFFFFF" opacity="0.8"/><path d="M96 0 L120 0 L24 96 L24 72 Z" fill="#FFFFFF" opacity="0.5"/>'
        '<path d="M0 196 C30 186 40 206 70 196 C100 186 110 206 140 196 C170 186 180 206 210 196 C224 192 236 194 240 198 L240 196 Q240 230 206 230 L34 230 Q0 230 0 196 Z" fill="#FFFFFF" opacity="0.85"/>'
        + SPARK(214, 30, 14, '#FFFFFF') + SPARK(36, 170, 9, '#FFFFFF')),
    # 쿠키 뽑기권(아이템): 물음표 쿠키
    'item-mystery': cookie(P['mystery'], front_extra='<path d="M52 98 C52 72 96 70 96 96 C96 112 76 114 76 130" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" fill="none"/><circle cx="76" cy="160" r="9" fill="#FFFFFF"/>',
                           over=SPARK(26, 28, 14, '#FFD43B') + SPARK(212, 190, 11, '#B9A6E8') + SPARK(206, 36, 8, '#FF9F1A')),
    # 뽑기 일반
    'gacha-strawberry': cookie(P['strawberry'], front_extra=''.join(f'<ellipse cx="{x}" cy="{y}" rx="3" ry="5" fill="#FFF1A8"/>' for x, y in [(50, 90), (80, 120), (60, 150), (96, 84), (100, 150), (36, 124)]),
                               under='<path d="M100 20 C110 0 130 0 140 16 C150 0 172 6 168 26 C150 24 120 28 100 20 Z" fill="#4CC38A"/>'),
    'gacha-lemon': cookie(P['lemon'], over='<g transform="translate(180 150)"><circle r="34" fill="#F5CF2E"/><circle r="28" fill="#FFF6B8"/>' + ''.join(f'<path d="M0 0 L{24*__import__("math").cos(a*0.785):.1f} {24*__import__("math").sin(a*0.785):.1f}" stroke="#F5CF2E" stroke-width="3"/>' for a in range(8)) + '</g>'),
    'gacha-blueberry': cookie(P['blueberry'], over=''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#3F4FA8"/><circle cx="{x+r*0.3}" cy="{y-r*0.3}" r="{r*0.3}" fill="#8E9CE8"/>' for x, y, r in [(180, 170, 18), (206, 140, 14), (160, 196, 12)])),
    'gacha-mintchip': cookie(P['mintchip'], front_extra=DOTS([(56, 96), (88, 128), (50, 150), (100, 80), (76, 170)], 8, '#5C3016'), back_extra=DOTS([(170, 90), (186, 126)], 7, '#5C3016')),
    'gacha-vanilla': cookie(P['vanilla'], front_extra=DOTS([(50, 100), (64, 130), (90, 110), (80, 160), (106, 140), (40, 140)], 2.5, '#3B2412'),
                            over='<g transform="translate(160 150) rotate(-30)"><rect x="0" y="0" width="70" height="10" rx="5" fill="#5C3016"/><path d="M60 5 C74 -6 84 6 76 14" stroke="#4CC38A" stroke-width="5" fill="none" stroke-linecap="round"/></g>'),
    # 뽑기 레어
    'gacha-sprinkle': cookie(P['sprinkle'], front_extra=SPRINKLES, back_extra=SPRINKLES),
    'gacha-macaron': cookie(P['macaron'], over='<path d="M106 30 C120 60 130 110 140 160 C148 166 156 166 160 160 C150 110 136 60 120 24 Z" fill="#FFFFFF"/>'),
    'gacha-donut': cookie(P['donut'], front_extra='<path d="M0 0 L160 0 L160 96 C140 116 126 96 110 110 C96 122 86 104 70 116 C54 128 42 108 24 118 C12 124 4 116 0 110 Z" fill="#FF8FB8"/>' + SPRINKLES,
                          back_extra='<path d="M100 0 L240 0 L240 100 C222 112 210 98 194 108 C178 118 164 102 146 112 L100 112 Z" fill="#F77FAB"/>'),
    # 뽑기 에픽
    'gacha-crystal': cookie(P['crystal'], front_extra='<path d="M14 84 L70 40 L120 30 L80 110 Z" fill="#E8FAFF"/><path d="M14 84 L80 110 L40 190 L8 150 Z" fill="#A8E6FB"/><path d="M80 110 L120 30 L132 120 L100 210 Z" fill="#BFEFFF"/>',
                            back_extra='<path d="M124 20 L210 90 L150 120 Z" fill="#D6F5FF"/>', over=SPARK(30, 30, 14, '#7FD2EE') + SPARK(214, 186, 12, '#FFFFFF') + SPARK(200, 30, 8, '#7FD2EE')),
    # 뽑기 전설
    'gacha-crown': cookie(P['crown'], over='<g transform="translate(64 -40)"><path d="M0 70 L10 10 L40 44 L64 0 L88 44 L118 10 L128 70 Z" fill="#FFD43B"/><path d="M0 70 L128 70 L124 86 L4 86 Z" fill="#E0A100"/><circle cx="64" cy="54" r="10" fill="#FF5C7A"/><circle cx="28" cy="58" r="7" fill="#4FB8F5"/><circle cx="100" cy="58" r="7" fill="#4CC38A"/></g>'
                          + SPARK(26, 40, 16, '#FFD43B') + SPARK(216, 190, 12, '#FFD43B') + SPARK(220, 60, 9, '#FF9F1A')),
})

# 내용이 바뀐 쿠키만 다시 쓴다 → to_pixel.py --missing이 새로 생기거나 바뀐 쿠키만 골라 변환할 수 있다
changed = []
for name, svg in ART.items():
    path = f'{name}.svg'
    if not os.path.exists(path) or open(path).read() != svg:
        open(path, 'w').write(svg); changed.append(name)
print(len(ART), 'cookies,', f'바뀐 것 {len(changed)}개:' if changed else '바뀐 것 없음', ' '.join(changed))
