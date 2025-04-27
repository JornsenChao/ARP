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
      lines.push(line);
      line = w;
    } else {
      line += (line ? ' ' : '') + w;
    }
  }
  if (line) lines.push(line);
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
    if (c.length <= maxLen) {
      final.push(c);
    } else {
      for (let i = 0; i < c.length; i += maxLen) {
        final.push(c.slice(i, i + maxLen));
      }
    }
  }
  return final;
}

/**
 * 合并跨页段落。
 * 输入: pages = [{ text: string, pageNum: number }, ...]
 * 逻辑：如果上一个段落末尾没碰到句号/问号等，则视为同一段落的延续；否则另起一段。
 * 最终返回 [{ text, startPage, endPage }, ...]
 */
function mergePageParagraphs(pages) {
  const merged = [];
  let buf = '';
  let bufStartPage = pages.length ? pages[0].pageNum : 1;

  for (let i = 0; i < pages.length; i++) {
    const { text, pageNum } = pages[i];
    if (!text.trim()) continue;

    if (!buf) {
      // 第一次初始化
      buf = text;
      bufStartPage = pageNum;
      continue;
    }
    // 判断是否需要合并到上一段
    const endsWithPunct = /[。！？.?!]\s*$/.test(buf);
    const startsWithLower = /^[a-z]/.test(text);
    // 如果本次 pageNum 与上一段落的 pageNum 不同，则直接“另起一段”
    const isPageChanged = pageNum !== bufStartPage;
    if ((!endsWithPunct || startsWithLower) && !isPageChanged) {
      // 继续合并到同一段
      buf += ' ' + text;
    } else {
      // 另起一段
      merged.push({
        text: buf.trim(),
        startPage: bufStartPage,
        endPage: pageNum - (isPageChanged ? 1 : 1),
      });
      buf = text;
      bufStartPage = pageNum;
    }
  }

  // 收尾
  if (buf) {
    // 最后这段一直延续到最后pageNum
    const lastPageNum = pages.length
      ? pages[pages.length - 1].pageNum
      : bufStartPage;
    merged.push({
      text: buf.trim(),
      startPage: bufStartPage,
      endPage: lastPageNum,
    });
  }
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
 * advancedPdfLoader
 * @param {string} absolutePath 绝对路径
 * @param {object} opts
 *   - chunkSizeChars?: number  单块最大字符（默认 1500）
 *   - lineLen?: number         自动换行长度（默认 80）
 *   - basePage?: number        PDF 中首页对应的实际页码（可选, 默认为 1）
 * @returns {Array<{pageContent:string, metadata:object}>}
 *
 * 示例：如果 PDF 的逻辑第一页在文档上是“iii”，你可以设 basePage = 0, or other offset
 */
export async function advancedPdfLoader(
  absolutePath,
  { chunkSizeChars = 1500, lineLen = 80, basePage = 1 } = {}
) {
  // 1) 读取并转 Uint8Array
  const buf = await fs.readFile(absolutePath);
  const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

  // 2) 解析 PDF → 获取每页文本
  const pdf = await getDocument({ data: uint8, disableWorker: true }).promise;

  // pageInfos 用于存放 { text, pageNum }
  const pageInfos = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const raw = tc.items.map((i) => i.str).join(' ');
    const normalized = normalize(raw);
    // 这里 p + basePage - 1 => 如果 basePage=1，则实际页码还是 p
    // 如果 basePage=0，说明pdf物理第一页可能是"封面"之类
    // 你可以自行决定如何加这个偏移
    const actualPageNum = p + basePage - 1;

    pageInfos.push({
      text: normalized,
      pageNum: actualPageNum,
    });
  }

  // 3) 合并跨页段落
  const merged = mergePageParagraphs(pageInfos);
  const fileName = path.basename(absolutePath);

  const chunks = [];

  // 4) 对每个合并段落做分句/长度切分
  for (const para of merged) {
    const pretty = insertLineBreaks(para.text, lineLen);
    const subChunks = splitBySentence(pretty, chunkSizeChars);

    // 这里 para.startPage, para.endPage 是合并后的大段落起止
    // 但它们都是数字，若相同则说明同一页，否则是区间
    subChunks.forEach((c, idx) => {
      const pageLabel =
        para.startPage === para.endPage
          ? `${para.startPage}`
          : `${para.startPage}-${para.endPage}`;
      chunks.push({
        pageContent: c,
        metadata: {
          fileName,
          page: pageLabel,
          chunkIndex: idx,
        },
      });
    });
  }

  console.log(
    `PDFLoader: parsed ${chunks.length} chunks from ${path.basename(
      absolutePath
    )}`
  );
  return chunks;
}

export default { advancedPdfLoader };
