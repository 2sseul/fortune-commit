# 쿠키 확인용 그림 만들기 (Chrome headless)
#   python3 preview.py sheet <출력.png> [이름 ...]  : 벡터 · 위젯 픽셀(다크) · 위젯 픽셀(라이트)를 한 장에 (이름 없으면 전부)
#   python3 preview.py figma <출력폴더> 이름 ...      : Figma에 올릴 4배 투명 PNG (마스크 문제 없이 그대로 보임)
#
# Figma에는 SVG를 바로 올리지 않는다. clipPath가 Figma에서 마스크 그룹이 되고, Figma 앱이 그걸 서버와 다르게 그려서
# 쿠키 조각이 벌어지거나 그림자·기호가 사라진 적이 있다. PNG로 올리면 어디서나 똑같이 보인다. (사이트는 원본 SVG를 쓴다)

import os, shutil, subprocess, sys, tempfile

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
HERE = os.path.dirname(os.path.abspath(__file__))
SKIP = ('item-', 'pixel-plain', 'retro')

def shot(html, out, w, h, transparent=False):
    flags = ['--default-background-color=00000000'] if transparent else []
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', *flags, f'--window-size={w},{h}',
                    f'--screenshot={os.path.abspath(out)}', f'file://{html}'], capture_output=True, check=True)

def sheet(out, names):
    names = names or sorted(n[:-4] for n in os.listdir(HERE) if n.endswith('.svg') and not n.startswith(SKIP))
    with tempfile.TemporaryDirectory() as tmp:
        for n in names:
            shutil.copy(os.path.join(HERE, f'{n}.svg'), os.path.join(tmp, f'v-{n}.svg'))
            px = os.path.join(HERE, 'pixel', f'{n}.svg')
            if os.path.exists(px): shutil.copy(px, os.path.join(tmp, f'p-{n}.svg'))
        cell = lambda n, kind, bg: (f'<div style="background:{bg};padding:6px;text-align:center"><img src="{kind}-{n}.svg" style="height:72px;image-rendering:pixelated"></div>'
                                    if os.path.exists(os.path.join(tmp, f'{kind}-{n}.svg')) else f'<div style="background:{bg}"></div>')
        rows = ''.join(f'<div style="font:11px sans-serif;color:#555;padding:4px">{n}</div>' + cell(n, 'v', '#FFF4E0') + cell(n, 'p', '#0D1117') + cell(n, 'p', '#FFFFFF') for n in names)
        html = os.path.join(tmp, 's.html')
        open(html, 'w').write(f'<html><body style="margin:0;display:grid;grid-template-columns:120px 100px 100px 100px;gap:2px;background:#ddd">'
                              f'<b style="padding:4px">이름</b><b>사이트(벡터)</b><b>위젯 다크</b><b>위젯 라이트</b>{rows}</body></html>')
        shot(html, out, 430, 30 + 88 * len(names))
    print(f'미리보기: {os.path.abspath(out)} ({len(names)}개)')

def figma(outdir, names):
    os.makedirs(outdir, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for n in names:
            shutil.copy(os.path.join(HERE, f'{n}.svg'), os.path.join(tmp, f'{n}.svg'))
            html = os.path.join(tmp, f'{n}.html')
            open(html, 'w').write(f'<html><body style="margin:0;background:transparent"><img src="{n}.svg" width="1040" height="1160" style="display:block"></body></html>')
            shot(html, os.path.join(outdir, f'{n}.png'), 1040, 1160, transparent=True)
            print(os.path.join(outdir, f'{n}.png'))

if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('sheet', 'figma'):
        print(__doc__ or '사용법은 파일 맨 위 주석 참고'); sys.exit(2)
    (sheet if sys.argv[1] == 'sheet' else figma)(sys.argv[2], sys.argv[3:])
