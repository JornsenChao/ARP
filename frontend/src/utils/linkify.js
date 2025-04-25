// frontend/src/utils/linkify.js
/**
 * linkify(str)
 *   - 找出str中的 http/https 链接，用 <a href="..." target="_blank">...</a> 包装
 *   - 返回带<a>标签的HTML字符串
 *   - 不处理其他潜在HTML转义问题，如需更安全，请再做XSS过滤
 */

export function linkify(str) {
  if (!str) return '';
  // 最简单的正则: 匹配 http 或 https 直到下一个空白字符
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/;

  return str.replace(urlRegex, (match) => {
    return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`;
  });
}
