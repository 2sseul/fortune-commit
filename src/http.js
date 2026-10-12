// 서버 함수들이 같이 쓰는 요청·응답 도우미 (/api/me, /api/shop)

// JSON으로 답한다. 사람마다 다른 정보라 캐시하지 않는다.
export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

// 요청 본문(JSON)을 읽는다. (Vercel은 미리 읽어 req.body에 넣어 주고, 로컬 서버는 직접 읽는다)
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

// 다른 사이트에서 몰래 보낸 요청을 막는다: 요청을 보낸 페이지(Origin)가 우리 사이트여야 한다.
export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}
