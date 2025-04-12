export function unifyDashes(str) {
  return str.replace(/[\u2012\u2013\u2014\u2015]/g, '-');
}

export function unifyHyperlinks(str) {
  let r = str;
  // 1) [text](url) => text (url)
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  // 2) <a href="url">text</a> => text (url)
  r = r.replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)');
  // 3) 去除其他 HTML tag
  r = r.replace(/<\/?[^>]+>/g, '');
  // 4) 裸URL => (URL)
  r = r.replace(/\b(https?:\/\/[^\s]+)/g, '($1)');
  return r;
}

export function sanitizeCellValue(raw) {
  if (!raw) return '';
  let str = String(raw);
  str = str
    .replace(/"""+/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\r+/g, ' ')
    .replace(/\t+/g, ' ');
  str = unifyDashes(str);
  str = unifyHyperlinks(str);
  return str.trim();
}
