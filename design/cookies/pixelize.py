# 벡터 쿠키 → 정교한 픽셀 쿠키 (48칸). 자홍색 바탕으로 렌더한 그림을 줄여 원본 색으로 정리하고 바깥 테두리 1칸.
import sys, re
from PIL import Image
N = 48
for n in sys.argv[1:]:
    svg = open(f'vector-{n}.svg').read()
    pal = [tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) for h in sorted(set(c.upper() for c in re.findall(r'#[0-9A-Fa-f]{6}', svg)) - {'#000000'})]
    img = Image.open(f'mag-{n}.svg.png').convert('RGB')
    w, h = img.size
    small = img.resize((N, N), Image.BOX); px = small.load()
    near = lambda c: min(pal, key=lambda p: sum((a-b)**2 for a, b in zip(p, c)))
    grid = [[None]*N for _ in range(N)]
    for y in range(N):
        for x in range(N):
            r, g, b = px[x, y]
            if r > 200 and b > 200 and g < 120: continue            # 자홍 바탕
            if r > 150 and b > 120 and g < 140 and abs(r-b) < 90: continue  # 가장자리 섞인 칸
            grid[y][x] = near((r, g, b))
    # 렌더 가장자리 선 제거
    for y in range(N):
        for x in range(N):
            if x >= 46 or y >= 46: grid[y][x] = None
    # 바탕과 맞닿은 칸이 분홍(볼·귀 색)으로 잡혔으면 자홍이 섞인 가장자리라서 지운다 (두 번 반복)
    pinks = {p for p in pal if p[0] > 240 and p[1] < 190 and p[2] > 150}
    for _ in range(2):
        for y in range(N):
            for x in range(N):
                if grid[y][x] in pinks and any(not (0 <= y+dy < N and 0 <= x+dx < N) or grid[y+dy][x+dx] is None for dy, dx in ((1,0),(-1,0),(0,1),(0,-1))):
                    grid[y][x] = None
    dark = min(pal, key=sum)
    out = [row[:] for row in grid]
    for y in range(N):
        for x in range(N):
            if grid[y][x] is None and any(0 <= y+dy < N and 0 <= x+dx < N and grid[y+dy][x+dx] for dy, dx in ((1,0),(-1,0),(0,1),(0,-1))):
                out[y][x] = dark
    cells = {}
    for y in range(N):
        x = 0
        while x < N:
            c = out[y][x]
            if c is None: x += 1; continue
            k = 1
            while x+k < N and out[y][x+k] == c: k += 1
            cells.setdefault(c, []).append(f'M{x} {y}h{k}v1h-{k}z'); x += k
    paths = ''.join(f'<path fill="#{c[0]:02X}{c[1]:02X}{c[2]:02X}" d="{"".join(d)}"/>' for c, d in cells.items())
    open(f'pixel-{n}.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 {N} {N}" shape-rendering="crispEdges">{paths}</svg>')
    print(n, img.size, len(cells))
