/**
 * 高质量 PDF 文本解析与分块工具
 * ---------------------------------
 * - 使用 pdfjs-dist/legacy —— 这是官方推荐的 Node 环境入口，避免 ESM + CJS 混杂问题
 * - 自动去掉多余空白、合并同段落行
 * - 采用 “可滑动窗口” chunking：maxChars / overlap，可在调用处调参
 *
 * install:  npm i pdfjs-dist
 */

import fs from 'fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?worker';

/** 去掉多余空白、连接断行 */
function normalize(text = '') {
  return text
    .replace(/-\s*\n\s*/g, '') // 连字号换行
    .replace(/\s*\n\s*/g, ' ') // 普通换行 → 空格
    .replace(/\s{2,}/g, ' ') // 多空白 → 1 空格
    .trim();
}

/** 按单词插入换行；尽量避免把词劈开 */
function insertLineBreaks(str = '', lineLen = 80) {
  if (!str) return '';
  const words = str.split(/\s+/); // 先按空白拿到所有单词
  let line = '';
  const lines = [];

  for (const w of words) {
    // 如果再加一个单词会超过 lineLen，就先换行
    if (line.length && line.length + w.length + 1 > lineLen) {
      lines.push(line); // push 完整行
      line = w; // 当前单词作为下一行开头
    } else {
      line += (line ? ' ' : '') + w; // 行首不加空格
    }
  }
  if (line) lines.push(line); // 收尾
  return lines.join('\n');
}

/** 句子 + 长度综合切分；不足则硬切 */
function splitBySentence(text, maxLen = 1500) {
  const chunks = [];
  let current = '';
  const punctRE = /[。！？.?!]/;

  for (const ch of text) {
    current += ch;
    if (punctRE.test(ch) && current.length >= maxLen * 0.8) {
      chunks.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // 对仍超长的做硬切
  const final = [];
  for (const c of chunks) {
    if (c.length <= maxLen) final.push(c);
    else {
      for (let i = 0; i < c.length; i += maxLen) {
        final.push(c.slice(i, i + maxLen));
      }
    }
  }
  return final;
}

/** 尝试把跨页被截断的段落重新合并 */
function mergePageParagraphs(pageTexts) {
  const merged = [];
  let buf = '';
  let startPg = 1;

  for (let idx = 0; idx < pageTexts.length; idx++) {
    const txt = pageTexts[idx];
    if (!txt.trim()) continue;

    if (!buf) {
      buf = txt;
      startPg = idx + 1;
      continue;
    }

    const endsWithPunct = /[。！？.?!]\s*$/.test(buf);
    const startsWithLower = /^[a-z]/.test(txt);

    if (!endsWithPunct || startsWithLower) {
      buf += ' ' + txt;
    } else {
      merged.push({ text: buf.trim(), startPage: startPg, endPage: idx });
      buf = txt;
      startPg = idx + 1;
    }
  }
  if (buf)
    merged.push({
      text: buf.trim(),
      startPage: startPg,
      endPage: pageTexts.length,
    });
  return merged;
}

/** 把长文本切成带重叠的块 */
function slidingWindowChunks(text, maxChars = 1200, overlap = 100) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start += maxChars - overlap;
  }
  return chunks;
}

/**
 * @param {string} absolutePath 绝对路径
 * @param {object} opts
 * @param {number} opts.chunkSizeChars  单块最大字符（默认 1500）
 * @param {number} opts.lineLen         自动换行长度（默认 80）
 * @returns {Array<{pageContent:string, metadata:object}>}
 */
export async function advancedPdfLoader(
  absolutePath,
  { chunkSizeChars = 1500, lineLen = 80 } = {}
) {
  /* 1. 读取并转 Uint8Array */
  const buf = await fs.readFile(absolutePath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

  /* 2. 解析 PDF → 获取每页文本 */
  const pdf = await getDocument({ data: uint8, disableWorker: true }).promise;
  const pageTexts = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const raw = tc.items.map((i) => i.str).join(' ');
    pageTexts.push(normalize(raw));
  }

  /* 3. 合并跨页段落，再句子/长度切分 */
  const merged = mergePageParagraphs(pageTexts);
  const fileName = path.basename(absolutePath);
  const chunks = [];

  for (const para of merged) {
    const pretty = insertLineBreaks(para.text, lineLen);
    const subChunks = splitBySentence(pretty, chunkSizeChars);

    subChunks.forEach((c, idx) =>
      chunks.push({
        pageContent: c,
        metadata: {
          fileName,
          page:
            para.startPage === para.endPage
              ? `${para.startPage}`
              : `${para.startPage}-${para.endPage}`,
          chunkIndex: idx,
        },
      })
    );
  }

  console.log(
    `PDFLoader: parsed ${chunks.length} chunks from ${path.basename(
      absolutePath
    )}`
  );
  return chunks;
}
export default { advancedPdfLoader };
