# design

v3 사이트 디자인 원본입니다. Figma 파일(fortune-commit design)에 올린 그림의 SVG 원본과 그림을 만드는 스크립트를 모아 둡니다.

- `cookies/` 사이트용 벡터 쿠키 11종 + 열린 쿠키 (듀오링고식: 큰 면 + 그림자 한 단계 + 하이라이트 하나, 얼굴 없음)
  - `make.py` 쿠키 SVG를 만드는 스크립트 (`python3 make.py`). 실루엣은 직접 그린 픽셀 쿠키(src/cookie.js)를 따랐다.
  - `to_pixel.py` 벡터 → 위젯용 픽셀 자동 변환 (`--missing`: 새로 생기거나 바뀐 쿠키만)
  - `preview.py` 확인용 시트(`sheet`)와 Figma용 4배 투명 PNG(`figma`)
  - `catalog.json` 쿠키 목록·해금 조건·뽑기 확률·아이템 가격
  - `pixel/` 위젯용 픽셀 지도(json)와 미리보기(svg)
  - `pixelize.py` 벡터 쿠키를 48칸 픽셀로 바꿔 보던 샘플 스크립트 (비교용, 지금은 안 씀)
  - 새 쿠키를 만드는 순서는 `.claude/skills/pixel-skin/SKILL.md`
  - `compact-pixel-svg.mjs` 위젯 픽셀 쿠키 SVG를 색별 경로로 합쳐 줄이는 스크립트 (Figma 업로드용)
- `illustrations/` 반죽이(첫 화면), 빵집 가게 앞(처음 시안, 보관)
- `icons/` 듀오링고식 색 아이콘 8개

README 위젯(터미널)은 계속 픽셀 쿠키(src/skins.js)를 씁니다.
