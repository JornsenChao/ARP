// frontend/src/utils/userId.js
// 这是一个小工具，保证每个用户(浏览器)生成并持久化一个ID

let cachedUserId = null;

export function getUserId() {
  if (cachedUserId) return cachedUserId;
  const stored = localStorage.getItem('APP_USER_ID');
  if (stored) {
    cachedUserId = stored;
    return stored;
  }
  // 如果没有，就生成一个
  const newId = 'user-' + crypto.randomUUID();
  localStorage.setItem('APP_USER_ID', newId);
  cachedUserId = newId;
  return newId;
}
