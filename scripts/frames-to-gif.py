# 화면 녹화 프레임(PNG 여러 장)을 GIF 하나로 묶는다. (scripts/readme-gifs.mjs가 부른다)
#   python3 frames-to-gif.py <frames.json> <출력.gif>
# frames.json: { list: [[파일, 시각(초), 화면 너비(CSS px), 위 여백], ...], crop: [x0, y0, x1, y1] (CSS px), width (GIF 가로 px) }
# 프레임 시각대로 길이를 정하고, 초당 약 12장으로 솎아 내서 파일 크기를 줄인다.

import json, sys
from PIL import Image

meta = json.load(open(sys.argv[1]))
frames, durations = [], []
last_t = None
for path, t, device_width, offset_top in meta['list']:
    if last_t is not None and t - last_t < 1 / 12:
        continue  # 너무 촘촘한 프레임은 건너뛴다
    im = Image.open(path).convert('RGB')
    k = im.width / device_width  # 녹화 프레임의 실제 배율 (CSS px → 그림 px)
    x0, y0, x1, y1 = [v * k for v in meta['crop']]
    y0 += offset_top * k; y1 += offset_top * k
    im = im.crop((max(0, int(x0)), max(0, int(y0)), min(im.width, int(x1)), min(im.height, int(y1))))
    w = meta['width']
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if frames:
        durations.append(max(40, round((t - last_t) * 1000)))
    frames.append(im)
    last_t = t
durations.append(1200)  # 마지막 장면은 조금 오래
# 장면마다 색이 달라서(뽑기 빛줄기 등) 프레임마다 자기 색표를 쓴다
out = [f.quantize(colors=160, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for f in frames]
out[0].save(sys.argv[2], save_all=True, append_images=out[1:], duration=durations, loop=0, optimize=True, disposal=1)
import os
print(f'{sys.argv[2]}: {len(out)}장, {os.path.getsize(sys.argv[2]) // 1024}KB')
