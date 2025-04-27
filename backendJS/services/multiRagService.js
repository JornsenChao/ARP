// server/services/multiRAGService.js

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RetrievalQAChain } from 'langchain/chains';
import {
  PromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
/**
 * MultiRAGService: 专门处理多文件 RAG 逻辑
 */
export const multiRAGService = {
  /**
   * 普通模式
   */
  async multiRAGQuery(
    stores,
    dependencyData,
    userQuery,
    language = 'en',
    customFields = [],
    topK = 3
  ) {
    const combinedQuery = combineDependencyUserQuery(
      dependencyData,
      userQuery,
      customFields
    );

    // 合并多个 store 的检索结果
    let allDocs = [];
    for (const st of stores) {
      const docs = await st.similaritySearch(combinedQuery, topK);
      allDocs.push(...docs);
    }

    // 构建 prompt
    const langPrompt = getLanguagePrompt(language);
    const context = allDocs
      .map(
        (d, idx) => `
---- Doc #${idx + 1} ---
${d.pageContent}
DEP: ${d.metadata.dependency}
REF: ${d.metadata.reference}
`
      )
      .join('\n');

    const template = `
You are an expert. ${langPrompt}

We found these chunks from MULTIPLE files:
${context}

Now answer the question below concisely, referencing the found data if needed:
${userQuery}
`;

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // 这里用 getRelevantDocuments 返回 allDocs
    const chain = RetrievalQAChain.fromLLM(
      model,
      { getRelevantDocuments: async () => allDocs },
      { prompt: PromptTemplate.fromTemplate(template) }
    );
    const response = await chain.call({ query: combinedQuery });
    return {
      answer: response.text,
      usedPrompt: template,
      docs: allDocs,
    };
  },

  /**
   * ================================
   * 新增: multiRAGSummarize(docs, language)
   *  - 按 fileName 分组, 再循环
   *  - 调用 doFileSummarize() => 返回 JSON
   * ================================
   * 主要负责对传进来的 docs 做分组、排序、逐文件生成摘要，然后合并返回最终结果。
   */
  async multiRAGSummarize(docs, language = 'en') {
    console.log('Line 90 [multiRAGSummarize] received docs:', docs);
    console.log('Line 91 [multiRAGSummarize] language:', language);
    try {
      if (!docs || !docs.length) {
        return { summary_items: [], sources: [] };
      }

      // 1) 按 fileName 把 docs 分组, 这样就能区分来自哪个文件的 chunk. grouped 是一个map，key是文件名，value是这个文件的所有 chunk
      const grouped = {};
      for (const doc of docs) {
        const fn = doc.metadata.fileName || 'unknown_file';
        if (!grouped[fn]) grouped[fn] = [];
        grouped[fn].push(doc);
      }

      // 2) 对每个文件组内的 chunk 按页码或行号进行排序。fn是文件名，grouped[fn]是这个文件的所有 chunk
      for (const fn in grouped) {
        grouped[fn].sort(
          (a, b) => parsePageOrRow(a.metadata) - parsePageOrRow(b.metadata)
        );

        console.log(
          `Line 111 fileName=${fn}, chunkCount=${grouped[fn].length}`
        );
      }

      let finalSummaryItems = [];
      let finalSources = [];

      // 3) 依次 Summarize
      for (const fn in grouped) {
        const chunksForFile = grouped[fn].map((doc) => ({
          pageOrLine: parsePageOrRowString(doc.metadata),
          content: doc.pageContent,
        }));
        console.log(
          `Line 125 [multiRAGSummarize] Summarizing file="${fn}" with chunksForFile length=`,
          chunksForFile.length
        );

        const singleFileJson = await doSimpleLLMSummarize(
          chunksForFile, // ← 把数组传进去
          fn,
          { language, modelName: 'gpt-4o-mini', temperature: 0 }
        );
        finalSummaryItems.push(...(singleFileJson.summary_items || []));
        finalSources.push(...(singleFileJson.sources || []));
      }

      // 4) 去重 sources
      const uniqueSources = deduplicateSources(finalSources);
      const summaryStr = buildSummaryString(finalSummaryItems, uniqueSources);
      console.log(
        'Line 145 [multiRAGSummarize] finalSummaryItems=',
        finalSummaryItems.length
      );
      console.log(
        'Line 149 [multiRAGSummarize] finalSources=',
        finalSources.length
      );
      console.log(
        'Line 150 [multiRAGSummarize] returning summary=',
        summaryStr
      );
      return {
        summary: summaryStr,
        summary_items: finalSummaryItems,
        sources: uniqueSources,
      };
    } catch (err) {
      console.error('Error in multiRAGSummarize:', err);
      return {
        error: true,
        message: err.message,
        stack: err.stack,
        summary_items: [],
        sources: [],
      };
    }
  },
  /**
   * 带 CoT 的多文件 RAG
   */
  async multiRAGQueryCoT(
    stores,
    dependencyData,
    userQuery,
    language = 'en',
    customFields = [],
    topK = 10
  ) {
    const combinedQuery = combineDependencyUserQuery(
      dependencyData,
      userQuery,
      customFields,
      true
    );

    // 合并检索
    let allDocs = [];
    for (const st of stores) {
      const docs = await st.similaritySearch(combinedQuery, topK);
      allDocs.push(...docs);
    }

    const langPrompt = getLanguagePrompt(language, true);
    const context = allDocs
      .map((d, idx) => `Doc#${idx + 1}: ${d.pageContent}`)
      .join('\n');

    const template = `
You are an expert. We want chain-of-thought.
${langPrompt}

Relevant docs from MULTIPLE files:
${context}

Question:
${userQuery}
`;

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = RetrievalQAChain.fromLLM(
      model,
      { getRelevantDocuments: async () => allDocs },
      { prompt: PromptTemplate.fromTemplate(template) }
    );
    const response = await chain.call({ query: combinedQuery });
    return {
      answer: response.text,
      usedPrompt: template,
      docs: allDocs,
    };
  },
};

// ===== 辅助函数 ===== //
function combineDependencyUserQuery(
  dependencyData,
  userQuery,
  customFields,
  isCoT = false
) {
  let depTexts = [];
  let refTexts = [];
  let strTexts = [];

  function distribute(obj) {
    if (!obj || !obj.values) return;
    const { values, type } = obj;
    if (type === 'dependency') depTexts.push(...values);
    else if (type === 'reference') refTexts.push(...values);
    else if (type === 'strategy') strTexts.push(...values);
  }
  distribute(dependencyData.climateRisks);
  distribute(dependencyData.regulations);
  distribute(dependencyData.projectTypes);
  distribute(dependencyData.environment);
  distribute(dependencyData.scale);

  (customFields || []).forEach((cf) => {
    if (cf.fieldType === 'dependency') depTexts.push(cf.fieldValue);
    else if (cf.fieldType === 'reference') refTexts.push(cf.fieldValue);
    else if (cf.fieldType === 'strategy') strTexts.push(cf.fieldValue);
  });

  const additional = dependencyData.additional || '';
  let combined = `
User Dependencies: ${depTexts.join(', ')}
User References: ${refTexts.join(', ')}
User Strategies: ${strTexts.join(', ')}
Additional: ${additional}

User's question: ${userQuery}
`.trim();

  if (isCoT) {
    combined = `[Chain of Thought Mode]\n${combined}`;
  }
  return combined;
}

function getLanguagePrompt(lang, shortMode = false) {
  if (lang === 'zh')
    return shortMode ? 'Answer in Chinese.' : 'You must answer in Chinese.';
  if (lang === 'es')
    return shortMode ? 'Answer in Spanish.' : 'You must answer in Spanish.';
  return shortMode ? 'Answer in English.' : 'You must answer in English.';
}

/**
 * parsePageOrRow(metadata):
 *   若 pdf chunk => metadata.page (可能"3"或"2-3")
 *   若 csv chunk => metadata.rowIndex
 */
/** parsePageOrRow => number for sorting */
function parsePageOrRow(meta) {
  if (meta.rowIndex != null) return meta.rowIndex;
  if (meta.page) {
    const parts = String(meta.page).split('-');
    return parseInt(parts[0], 10) || 0;
  }
  return 0;
}

/** parsePageOrRowString => "page 3" or "row 5" etc. */
function parsePageOrRowString(meta) {
  if (meta.rowIndex != null) {
    return `row ${meta.rowIndex}`;
  }
  if (meta.page) {
    return `page ${String(meta.page)}`;
  }
  return 'page/line?';
}

/** 去重 source */
function deduplicateSources(arr) {
  const seen = new Set();
  const result = [];
  for (const s of arr) {
    const key = `${s.fileName}@@${s.pageOrLine}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(s);
    }
  }
  return result;
}

/**
 * doSimpleLLMSummarize
 *   => 生成 JSON { summary_items, sources }
 */
async function doSimpleLLMSummarize(
  chunks,
  fileName,
  // pageOrLine,
  { language = 'en', modelName = 'gpt-4o-mini', temperature = 0 } = {}
) {
  // 把数组展开为带页码标头的长文本，供 LLM 读取
  const chunksText = chunks
    .map((c, i) => `--- [Chunk ${i + 1} | ${c.pageOrLine}] ---\n${c.content}`)
    .join('\n\n');
  // 1) 准备 systemPrompt: 给AI指令 => 详细分步
  const systemPrompt = `
You are a senior AEC analyst.
Your ONLY allowed response MUST be valid JSON that conforms exactly to the following schema:

${SUMMARY_SCHEMA}

General rules:
- Write in ${language}.
- Combine information across chunks **from the SAME file** (${fileName}).
- After each concise fact include its own source object using the page/row
  shown in each chunk header (e.g. "page 22" or "row 51").
- Do NOT invent pages; only use those present in the headers.
- No markdown, no extra keys.
`.trim();

  // 2) humanPrompt: 把具体的 content + fileName/pageOrLine 告诉模型
  const humanPrompt = `
CHUNKS FROM FILE: ${fileName}

{chunks_text}

Respond ONLY with JSON that matches the schema above.
`.trim();

  // 3) Prompt object
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(systemPrompt),
    HumanMessagePromptTemplate.fromTemplate(humanPrompt),
  ]);

  // 4) Chat model with strict response_format
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || modelName,
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature,
    response_format: { type: 'json_schema', schema: SUMMARY_SCHEMA_RAW },
  });

  // 5) Chain execution
  console.log('Line 377 [doSimpleLLMSummarize] text length = ', chunks.length);
  console.log('Line 378 [doSimpleLLMSummarize] fileName = ', fileName);
  const chain = new LLMChain({ llm: model, prompt });
  const response = await chain.call({ chunks_text: chunksText });
  console.log('Line 382 [doSimpleLLMSummarize] input=', chunks);
  console.log(
    'Line 375 [doSimpleLLMSummarize] raw LLM response=',
    response?.text
  );
  let rawOutput = (response?.text || '').trim();
  rawOutput = stripTripleBackticks(rawOutput);

  try {
    return JSON.parse(rawOutput); // { summary_items, sources }
  } catch (err) {
    console.error(
      'Line 394 [doSimpleLLMSummarize] JSON parse error, rawOutput=',
      rawOutput
    );
    throw new Error('LLM returned invalid JSON: ' + rawOutput);
  }
}
/** 如果开头结尾有 ```xxx 之类，去掉 */
function stripTripleBackticks(str) {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

const SUMMARY_SCHEMA_RAW = {
  type: 'object',
  properties: {
    summary_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          source: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              pageOrLine: { type: 'string' },
            },
            required: ['fileName', 'pageOrLine'],
          },
        },
        required: ['content', 'source'],
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fileName: { type: 'string' },
          pageOrLine: { type: 'string' },
        },
        required: ['fileName', 'pageOrLine'],
      },
    },
  },
  required: ['summary_items', 'sources'],
};
const SUMMARY_SCHEMA = escapeBraces(
  JSON.stringify(SUMMARY_SCHEMA_RAW, null, 2)
);
function escapeBraces(str) {
  return str.replace(/{/g, '{{').replace(/}/g, '}}');
}
function buildSummaryString(items, sources) {
  let text = '';
  for (const it of items) {
    // 每条 content 一行
    text += it.content + '\n';
  }
  text += '\n-----\nSources:\n';
  for (const s of sources) {
    text += `${s.fileName}, ${s.pageOrLine}\n`;
  }
  return text.trim();
}
