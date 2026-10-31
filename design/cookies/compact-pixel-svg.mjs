// 픽셀 SVG(rect 여러 개)를 색별 path 하나로 합친다. 가로로 이어진 칸은 하나로 묶는다.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const [inDir, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(inDir).filter(n => n.endsWith('.svg'))) {
  const src = readFileSync(`${inDir}/${f}`, 'utf8');
  // translate 합산은 단순화: 바깥 translate(32 32) + 각 그룹 transform 무시하지 않도록 rect만 읽되 그룹 이동이 있으면 경고
  const groups = [...src.matchAll(/transform="([^"]+)"/g)].map(m => m[1]);
  const cells = new Map(); // color -> Set("x,y")
  let minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
  for (const m of src.matchAll(/<rect x="(-?\d+)" y="(-?\d+)" width="8" height="8" fill="(#[0-9A-Fa-f]{6})"\/>/g)) {
    const x = +m[1] / 8, y = +m[2] / 8, c = m[3].toUpperCase();
    if (!cells.has(c)) cells.set(c, new Set());
    cells.get(c).add(`${x},${y}`);
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const paths = [];
  for (const [c, set] of cells) {
    let d = '';
    const pts = [...set].map(s => s.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    let i = 0;
    while (i < pts.length) {
      const [x, y] = pts[i]; let w = 1;
      while (i + w < pts.length && pts[i + w][1] === y && pts[i + w][0] === x + w) w++;
      d += `M${x - minX} ${y - minY}h${w}v1h-${w}z`;
      i += w;
    }
    paths.push(`<path fill="${c}" d="${d}"/>`);
  }
  const W = maxX - minX + 1, H = maxY - minY + 1;
  writeFileSync(`${outDir}/${f}`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 4}" height="${H * 4}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${paths.join('')}</svg>`);
  if (groups.length > 1) process.stderr.write(`${f}: transforms ${groups.join(' | ')}\n`);
}
