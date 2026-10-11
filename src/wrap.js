// 긴 문구를 여러 줄로 나누는 모듈
// SVG의 <text>는 자동 줄바꿈이 없어서, 글자 폭을 어림잡아 직접 줄을 나눈다.

// 14px 고정폭 글꼴 기준 글자 폭 어림값 (px)
const WIDE_CHAR = 14; // 한글·한자 등 넓은 글자
const NARROW_CHAR = 8.6; // 영문·숫자·기호

// 한글처럼 넓게 그려지는 글자인지 판단한다.
function isWide(ch) {
  const code = ch.codePointAt(0);
  return (
    (code >= 0x1100 && code <= 0x11ff) || // 한글 자모
    (code >= 0x2e80 && code <= 0x9fff) || // 한자·일본어 등
    (code >= 0xac00 && code <= 0xd7a3) || // 한글 음절
    (code >= 0xff00 && code <= 0xffef) // 전각 기호
  );
}

// 문자열이 화면에서 차지할 폭(px)을 어림잡는다.
export function textWidth(text) {
  let width = 0;
  for (const ch of text) width += isWide(ch) ? WIDE_CHAR : NARROW_CHAR;
  return width;
}

// 너무 긴 단어(공백 없는 긴 문자열)는 글자 단위로 자른다.
function breakLongWord(word, maxWidth) {
  const pieces = [];
  let piece = '';
  for (const ch of word) {
    if (piece && textWidth(piece + ch) > maxWidth) {
      pieces.push(piece);
      piece = '';
    }
    piece += ch;
  }
  if (piece) pieces.push(piece);
  return pieces;
}

// 문구를 maxWidth(px) 안에 들어가도록 단어 단위로 줄바꿈한 배열을 돌려준다.
export function wrapText(text, maxWidth) {
  const lines = [];
  let line = '';

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    // 단어 하나가 한 줄보다 길면 글자 단위로 잘라 넣는다.
    const pieces = breakLongWord(word, maxWidth);
    line = pieces.pop();
    lines.push(...pieces);
  }
  if (line) lines.push(line);
  return lines;
}
