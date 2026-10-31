# 벡터 쿠키 → 위젯용 픽셀 쿠키 (자동 변환)
# 사용법: python3 to_pixel.py plain cat javascript ...   (이름을 안 주면 전부)
#
# 1) 각 쿠키 SVG를 자홍색 바탕으로 두 번 렌더한다 (Chrome headless)
#      full  : 전체 그림
#      front : 뒤 날개(id="back")를 숨긴 그림 → 이 칸들은 '앞 조각'
# 2) 위젯 격자로 줄인다. 쿠키 몸통(가로 약 208px)이 지금 위젯 쿠키처럼 가로 27칸이 되게 1칸 = 7.7px
# 3) 칸 색을 그 쿠키 SVG에 쓰인 색 중 가장 가까운 색으로 맞추고, 바깥에 진한 테두리 1칸을 두른다
# 4) 결과: pixel/<이름>.json (위젯용 지도) + pixel/<이름>.svg (미리보기)
#    지도 글자: 대문자 = 앞 조각, 소문자 = 뒤 날개 (src/cookie.js와 같은 규칙, 갈라질 때 따로 움직임)

import json, os, re, subprocess, sys, tempfile
from PIL import Image

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VIEW_W, VIEW_H = 260, 290          # make.py의 viewBox 크기
CELL = 7.7                          # 1칸 = 7.7px
GW, GH = round(VIEW_W / CELL), round(VIEW_H / CELL)
SCALE = 4                           # 렌더 배율 (줄일 때 정확하도록 크게 그린 뒤 줄임)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'pixel')

def render(svg_text, path):
    with tempfile.TemporaryDirectory() as tmp:
        svg = os.path.join(tmp, 'c.svg'); html = os.path.join(tmp, 'c.html')
        open(svg, 'w').write(svg_text)
        w, h = VIEW_W * SCALE, VIEW_H * SCALE
        open(html, 'w').write(f'<html><body style="margin:0;background:#FF00FF"><img src="c.svg" width="{w}" height="{h}" style="display:block"></body></html>')
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={w},{h}',
                        f'--screenshot={path}', f'file://{html}'], capture_output=True, check=True)

def is_bg(c):
    r, g, b = c[:3]
    return r > 170 and b > 170 and g < 110          # 자홍 바탕 (가장자리 섞임 포함)

def to_grid(png, pal):
    img = Image.open(png).convert('RGB')
    grid = [[None] * GW for _ in range(GH)]
    for gy in range(GH):
        for gx in range(GW):
            # 칸 하나에 해당하는 영역에서 바탕이 아닌 픽셀의 평균
            x0, y0 = int(gx * CELL * SCALE), int(gy * CELL * SCALE)
            x1, y1 = int((gx + 1) * CELL * SCALE), int((gy + 1) * CELL * SCALE)
            px = [img.getpixel((x, y)) for y in range(y0, min(y1, img.height), 2) for x in range(x0, min(x1, img.width), 2)]
            solid = [p for p in px if not is_bg(p)]
            if len(solid) < len(px) * 0.5:
                continue
            avg = tuple(sum(p[i] for p in solid) // len(solid) for i in range(3))
            grid[gy][gx] = min(pal, key=lambda c: sum((a - b) ** 2 for a, b in zip(c, avg)))
    return grid

def palette(svg_text):
    hexes = sorted(set(h.upper() for h in re.findall(r'#[0-9A-Fa-f]{6}', svg_text)) - {'#000000', '#FF00FF'})
    return [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in hexes]

def convert(name):
    # null은 그림이 점선뿐이라 모양은 기본 쿠키 실루엣을 빌린다
    src = open(os.path.join(HERE, f'{"plain" if name == "null" else name}.svg')).read()
    pal = palette(src)
    with tempfile.TemporaryDirectory() as tmp:
        full_png, front_png = os.path.join(tmp, 'full.png'), os.path.join(tmp, 'front.png')
        render(src, full_png)
        render(src.replace('<g id="back">', '<g id="back" style="display:none">', 1), front_png)
        full, front = to_grid(full_png, pal), to_grid(front_png, pal)
    # 바깥 테두리: 가장 어두운 색을 더 어둡게 (손그림 픽셀처럼 또렷하게)
    dark = tuple(int(v * 0.7) for v in min(pal, key=sum))
    pal = pal + [dark]
    out = [row[:] for row in full]
    # 주름: 앞 조각 칸 중 오른쪽(또는 오른쪽 아래)이 뒤 날개인 칸을 주름색으로
    fold = sorted(pal, key=sum)[1] if len(pal) > 2 else dark
    for y in range(GH):
        for x in range(GW - 1):
            if front[y][x] and full[y][x] and not front[y][x + 1] and full[y][x + 1]:
                out[y][x] = fold
    for y in range(GH):
        for x in range(GW):
            if full[y][x] is None and any(0 <= y + dy < GH and 0 <= x + dx < GW and full[y + dy][x + dx]
                                          for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out[y][x] = dark
    # null 쿠키: 안을 비우고 테두리만 점선으로 (벡터와 같은 '텅 빈 쿠키')
    if name == 'null':
        import math
        gray = (175, 175, 175)
        pts = [(x, y) for y in range(GH) for x in range(GW) if full[y][x]]
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        for y in range(GH):
            for x in range(GW):
                edge = full[y][x] and any(not (0 <= y + dy < GH and 0 <= x + dx < GW) or not full[y + dy][x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                out[y][x] = gray if edge and int((math.atan2(y - cy, x - cx) + math.pi) / (2 * math.pi) * 36) % 2 == 0 else None
    # 글자 지도: 색마다 글자 하나, 앞 조각이면 대문자
    colors = sorted({c for row in out for c in row if c})
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    key = {c: letters[i] for i, c in enumerate(colors)}
    def piece(y, x):
        # 테두리 칸은 이웃 칸의 조각을 따른다
        if front[y][x]: return True
        return any(0 <= y + dy < GH and 0 <= x + dx < GW and front[y + dy][x + dx] for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    rows = []
    for y in range(GH):
        line = ''
        for x in range(GW):
            c = out[y][x]
            if c is None: line += '.'; continue
            ch = key[c]
            line += ch if piece(y, x) else ch.lower()
        rows.append(line)
    # 위아래·좌우 빈 줄 잘라내기
    while rows and set(rows[0]) == {'.'}: rows.pop(0)
    while rows and set(rows[-1]) == {'.'}: rows.pop()
    left = min(len(r) - len(r.lstrip('.')) for r in rows); right = max(len(r.rstrip('.')) for r in rows)
    rows = [r[left:right] for r in rows]
    os.makedirs(OUT, exist_ok=True)
    pal_hex = {key[c]: '#%02X%02X%02X' % c for c in colors}
    json.dump({'name': name, 'palette': pal_hex, 'map': rows}, open(os.path.join(OUT, f'{name}.json'), 'w'), ensure_ascii=False, indent=1)
    # 미리보기 SVG
    cells = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{pal_hex[ch.upper()]}"/>' for y, r in enumerate(rows) for x, ch in enumerate(r) if ch != '.')
    open(os.path.join(OUT, f'{name}.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{len(rows[0]) * 8}" height="{len(rows) * 8}" viewBox="0 0 {len(rows[0])} {len(rows)}" shape-rendering="crispEdges">{cells}</svg>')
    return len(rows[0]), len(rows), len(colors)

if __name__ == '__main__':
    names = sys.argv[1:] or sorted(n[:-4] for n in os.listdir(HERE) if n.endswith('.svg') and n not in ('pixel-plain.svg', 'retro.svg'))
    for n in names:
        print(n, convert(n))
