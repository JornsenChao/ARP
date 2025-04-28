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
    console.log('Line 91 [multiRAGSummarize] received docs:', docs);
    console.log('Line 92 [multiRAGSummarize] language:', language);
    try {
      if (!docs || !docs.length) {
        return {
          summary_items: {}, // {}
          summary: '', // string
          sources: [], // []
        };
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
          `Line 116 fileName=${fn}, chunkCount=${grouped[fn].length}`
        );
      }

      let finalSummaryItems = [];
      let finalSources = [];
      let fileSummaryMap = {}; // 存放每个文件的单独Summary { [fileName]: { summaryStr, summaryItems, sources } }

      // 3) 依次 Summarize
      for (const fn in grouped) {
        // fn是文件名，grouped[fn]是这个文件的所有 chunk
        // 将grouped[fn]下的所有 chunk 转换成一个数组，里面每个元素是一个对象，包含两个键值对：pageOrLine 和 content。 pageOrLine 是这个 chunk 的页码或行号， content 是这个 chunk 的正文内容。
        const chunksForFile = grouped[fn].map((doc) => ({
          pageOrLine: parsePageOrRowString(doc.metadata),
          content: doc.pageContent,
        }));
        console.log(
          `Line 133 [multiRAGSummarize] Summarizing file="${fn}" with chunksForFile length=`,
          chunksForFile.length
        );

        // 3.1) doSimpleLLMSummarize => chunk-level summary_items
        // 调用 doSimpleLLMSummarize 函数，传入处理好的数组chunksForFile、文件名fn和配置
        // 得到的singleFileJson是一个包含summary_items和sources的对象。其中summary_items是一个数组，包含了这个处理后的文件的摘要（多个），sources是一个数组，包含了这个文件的来源（多个）。
        const singleFileJson = await doSimpleLLMSummarize(
          chunksForFile, // ← 将文档的分块数组传递给函数
          fn, // ← 当前处理的文件名
          { language, modelName: 'gpt-4o-mini', temperature: 0 } // ← 配置对象，语言、模型和温度
        );

        // 3.2) 调用 buildSummaryString() => 对本文件 chunk-level summary_items 再做“二次 LLM”综合
        // 根据这个文件内的所有 chunk，获取unique的source set，以及概括所有chunk的摘要fileSummaryStr
        const uniqueSources = deduplicateSources(singleFileJson.sources || []);
        const fileSummaryStr = await buildSingleFileSummaryString(
          singleFileJson.summary_items,
          uniqueSources
        );
        console.log(
          'Line 154 [multiRAGSummarize] finalSummaryItems: ',
          fileSummaryStr
        );
        console.log(
          'Line 158 [multiRAGSummarize] singleFileJson.summary_items: ',
          singleFileJson.summary_items
        );
        console.log(
          'Line 162 [multiRAGSummarize] uniqueSources: ',
          uniqueSources
        );
        // 把1个文件级别的sumamry，所有摘要级别的chunk summary-来源 pair，以及unique的source set，存到fileSummaryMap
        fileSummaryMap[fn] = {
          summaryStr: fileSummaryStr,
          summaryItems: singleFileJson.summary_items,
          sources: uniqueSources,
        };
        // 将singleFileJson.summary_items和singleFileJson.sources添加到finalSummaryItems和finalSources
        // finalSummaryItems包含了所有chunk的摘要，
        // finalSources包含了所有chunk的来源
        // finalSummaryItems.push(...(singleFileJson.summary_items || []));
        // finalSources.push(...(singleFileJson.sources || []));
        // console.log(
        //   'Line 143 [multiRAGSummarize] finalSummaryItems: ',
        //   finalSummaryItems
        // );
        // console.log(
        //   'Line 144 [multiRAGSummarize] finalSources: ',
        //   finalSources
        // );
      }
      console.log(
        'Line 186 [multiRAGSummarize] fileSummaryMap: ',
        fileSummaryMap
      );
      // 4) 全局再做一次“总结”
      const uniqueGlobalSources = [];
      for (const fn in fileSummaryMap) {
        let fileSourceTemp = deduplicateSources(fileSummaryMap[fn].sources);
        uniqueGlobalSources.push(...fileSourceTemp);
      }
      console.log(
        'Line 196 [multiRAGSummarize] uniqueGlobalSources: ',
        uniqueGlobalSources
      );
      let globalSummaryStr = '';
      globalSummaryStr = await buildMultiFileSummaryString(fileSummaryMap);
      console.log(
        'Line 204 [multiRAGSummarize] returning globalSummaryStr=',
        globalSummaryStr
      );
      return {
        summary: globalSummaryStr, // string
        summary_items: fileSummaryMap, // {}
        sources: uniqueGlobalSources, // []
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
/**
 * deduplicateSources: remove duplicate source objects (by fileName and pageOrLine)
 * @param {Array} arr: source array
 * @returns {Array} new array with duplicates removed
 */
function deduplicateSources(arr) {
  const seen = new Set();
  const result = [];
  for (const s of arr) {
    // use a compound key to distinguish sources
    const key = `${s.fileName}@@${s.pageOrLine}`;
    if (!seen.has(key)) {
      // add it to the set to mark as seen
      seen.add(key);
      // add it to the result array
      result.push(s);
    }
  }
  return result;
}

/**
 * doSimpleLLMSummarize
 *   => 接受一个文档数组 (来自同一个文件的多个chunk)
[
  {
    pageOrLine: 'page 6',
    content: 'AAAAAAAAAAA'
  },
  {
    pageOrLine: 'page 6',
    content: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  },
  {
    pageOrLine: 'page 18',
    content: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  }
]
 *   => 生成 JSON { summary_items, sources }
{
summary_items": [
    {
      "content": "AAAAAAAAAAAAAAAA",
      "source": {
        "fileName": "ABC.pdf",
        "pageOrLine": "page 6"
      }
    },
    {
      "content": "BBBBBBBBBBBBBBB",
      "source": {
        "fileName": "ABC.pdf",
        "pageOrLine": "page 6"
      }
    },
    {
      "content": "CCCCCCCCCCCCCCCCC",
      "source": {
        "fileName": "ABC.pdf",
        "pageOrLine": "page 6"
      }
    },
    {
      "content": "DDDDDDDDDDDDDDDDD",      
      "source": {
        "fileName": "ABC.pdf",
        "pageOrLine": "page 18"
      }
    }
  ],
  "sources": [
    {
      "fileName": "ABC.pdf",
      "pageOrLine": "page 6"
    },
    {
      "fileName": "ABC.pdf",
      "pageOrLine": "page 18"
    }
  ]
 ]}
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
  console.log('Line 477 [doSimpleLLMSummarize] text length = ', chunks.length);
  console.log('Line 478 [doSimpleLLMSummarize] fileName = ', fileName);
  const chain = new LLMChain({ llm: model, prompt });
  const response = await chain.call({ chunks_text: chunksText });
  console.log('Line 482 [doSimpleLLMSummarize] input=', chunks);
  console.log(
    'Line 475 [doSimpleLLMSummarize] raw LLM response=',
    response?.text
  );
  let rawOutput = (response?.text || '').trim();
  rawOutput = stripTripleBackticks(rawOutput);

  try {
    return JSON.parse(rawOutput); // { summary_items, sources }
  } catch (err) {
    console.error(
      'Line 494 [doSimpleLLMSummarize] JSON parse error, rawOutput=',
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
// function buildSummaryString(items, sources) {
//   let text = '';
//   for (const it of items) {
//     // 每条 content 一行
//     text += it.content + '\n';
//   }
//   text += '\n-----\nSources:\n';
//   for (const s of sources) {
//     text += `${s.fileName}, ${s.pageOrLine}\n`;
//   }
//   return text.trim();
// }

async function buildSingleFileSummaryString(items, sources) {
  // 1) 先把 chunk-level items 和 sources 列表，简单拼成一个初步字符串
  let draftText = '';
  for (const it of items) {
    draftText += '- ' + it.content + '\n';
    // 如果需要在提示中携带该条的 source，也可以一起放进 draftText
    // draftText += `  (Source: ${it.source.fileName}, ${it.source.pageOrLine})\n`;
  }
  // 如果你想在 Prompt 中额外放上 sources，也可以一起写入
  let sourceText = 'Sources:\n';
  for (const s of sources) {
    sourceText += `- ${s.fileName}, ${s.pageOrLine}\n`;
  }

  // 2) 构造一个 Prompt，让 LLM 把 draftText 做进一步“摘要整合”
  const systemTemplate = `
You are a senior architecture/engineering professional.
Now you are given a list of chunk-level bullet points from the same file, plus a list of sources.
Please produce a concise summary (1-2 paragraphs) that integrates these bullet points into a cohesive short overview, but do NOT mix them with other files. 
Mention key ideas or actions, and keep the text in the same language if possible.
Return only the summarized text, no JSON.
  `.trim();

  const humanTemplate = `
CHUNK-LEVEL ITEMS:
{draftText}

{sourceText}

Please summarize them above into a cohesive short overview. 
The final output should NOT be JSON, just a paragraph or two of natural language.
  `.trim();

  // 构造 langchain 的 PromptTemplate
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(systemTemplate),
    HumanMessagePromptTemplate.fromTemplate(humanTemplate),
  ]);

  // 3) 调用 LLMChain 来完成二次摘要
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });
  const chain = new LLMChain({ llm: model, prompt });
  const response = await chain.call({
    draftText,
    sourceText,
  });

  // 4) 得到 LLM 的“整合摘要”文本
  const finalSummary = (response.text || '').trim();

  return finalSummary;
}

export async function buildMultiFileSummaryString(
  fileSummaryMap,
  language = 'en'
) {
  // 1) 将所有文件的 summaryStr 收集为 bullet points
  const fileEntries = Object.entries(fileSummaryMap);
  if (!fileEntries.length) {
    return '';
  }

  // 拼装 bullet 列表，如：
  // - (1) [CR4HC_8_Wildfire.pdf] <其 summaryStr 去掉结尾 sources部分>
  // - (2) [All Options Embed.csv] <...>
  let bulletPoints = '';
  let aggregatedSources = [];
  fileEntries.forEach(([fn, obj], idx) => {
    const n = idx + 1;
    bulletPoints += `- (${n}) [${fn}] ${obj.summaryStr}\n\n`;
    aggregatedSources.push(...(obj.sources || []));
  });

  // 2) 去重 sources
  const uniqueSources = deduplicateSources(aggregatedSources);

  // 3) 用 LLMChain 做最终“多文件顶层摘要”，类似 buildSummaryString
  //    System Prompt
  const systemPrompt = `
You are a helpful assistant. 
Now we have multiple files, each file already has a short summary. 
We want you to produce a high-level summary that combines these file-level summaries into at most 2~3 short paragraphs in ${language}. 
Do not mix up or merge distinct facts across files incorrectly, but do highlight common themes or differences if appropriate.
No JSON. Write plain text. 
`.trim();

  //    Human Prompt
  const humanPrompt = `
Below are bullet points, each bullet is a "file-level summary" from different files:

${bulletPoints}

Please produce a short "global" summary or top-level synthesis across all these files. 
`.trim();

  // 调用 chat model
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
  });

  const prompt = new PromptTemplate({
    template: `SYSTEM:\n{system}\n\nUSER:\n{user}`,
    inputVariables: ['system', 'user'],
  });

  const chain = new LLMChain({ llm: model, prompt });
  const response = await chain.call({
    system: systemPrompt,
    user: humanPrompt,
  });
  const globalSummary = (response?.text || '').trim();

  // 4) 在末尾列出 Sources
  let final = globalSummary + `\n\n-----\nSources:\n`;
  for (const s of uniqueSources) {
    final += `${s.fileName}, ${s.pageOrLine}\n`;
  }
  return final.trim();
}
