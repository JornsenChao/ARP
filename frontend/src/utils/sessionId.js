// frontend/src/utils/sessionId.js
// 这是一个小工具，保证每个用户(浏览器)生成并持久化一个ID

let cachedSessionId = null;

export function getSessionId() {
  if (cachedSessionId) return cachedSessionId;
  const stored = localStorage.getItem('APP_SESSION_ID');
  if (stored) {
    cachedSessionId = stored;
    return stored;
  }
  // 如果没有，就生成一个
  const newId = 'session-' + crypto.randomUUID();
  localStorage.setItem('APP_SESSION_ID', newId);
  cachedSessionId = newId;
  return newId;
}
