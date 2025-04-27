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
    topK = 20
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
   */
  async multiRAGSummarize(docs, language = 'en') {
    try {
      if (!docs || !docs.length) {
        return { summary_items: [], sources: [] };
      }

      // 1) 按 fileName 分组
      const grouped = {};
      for (const doc of docs) {
        const fn = doc.metadata.fileName || 'unknown_file';
        if (!grouped[fn]) grouped[fn] = [];
        grouped[fn].push(doc);
      }

      // 2) 按 page/row 排序
      for (const fn in grouped) {
        grouped[fn].sort(
          (a, b) => parsePageOrRow(a.metadata) - parsePageOrRow(b.metadata)
        );
      }

      let finalSummaryItems = [];
      let finalSources = [];

      // 3) 依次 Summarize
      for (const fn in grouped) {
        const combinedText = grouped[fn]
          .map((doc) => {
            const pOrL = parsePageOrRowString(doc.metadata);
            return `--- [Chunk from ${pOrL}] ---\n${doc.pageContent}`;
          })
          .join('\n\n');

        const firstMeta = grouped[fn][0].metadata;
        const pageOrLine = parsePageOrRowString(firstMeta);

        const singleFileJson = await doSimpleLLMSummarize(
          combinedText,
          fn,
          pageOrLine,
          { language, modelName: 'gpt-4.1', temperature: 0 }
        );
        finalSummaryItems.push(...(singleFileJson.summary_items || []));
        finalSources.push(...(singleFileJson.sources || []));
      }

      // 4) 去重 sources
      const uniqueSources = deduplicateSources(finalSources);
      const summaryStr = buildSummaryString(finalSummaryItems, uniqueSources);

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
  text,
  fileName,
  pageOrLine,
  { language = 'en', modelName = 'gpt-4.1', temperature = 0 } = {}
) {
  // 1) 准备 systemPrompt: 给AI指令 => 详细分步
  const systemPrompt = `
You are a senior AEC analyst.

Your ONLY allowed response MUST be valid JSON that conforms exactly to the following schema:

${JSON.stringify(SUMMARY_SCHEMA, null, 2)}

General rules:
- Use ${language} language.
- For every distinct fact, write a concise sentence (≤ 30 words) and store it in \"summary_items[].content\".
- Immediately after each sentence create its corresponding \"source\" object using the provided references.
- Do NOT add markdown, comments, or extra keys.
`.trim();

  // 2) humanPrompt: 把具体的 content + fileName/pageOrLine 告诉模型
  const humanPrompt = `
TEXT TO SUMMARIZE:
{{text}}

Its source is: ${fileName}, ${pageOrLine}.
Remember: respond ONLY with JSON that matches the schema above.
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
    response_format: { type: 'json_schema', schema: SUMMARY_SCHEMA },
  });

  // 5) Chain execution
  const chain = new LLMChain({ llm: model, prompt });
  const response = await chain.call({ text });
  let rawOutput = (response?.text || '').trim();
  rawOutput = stripTripleBackticks(rawOutput);

  try {
    return JSON.parse(rawOutput); // { summary_items, sources }
  } catch (err) {
    console.error('Error parsing Summarize JSON:', err, rawOutput);
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
          content: { type: 'string', description: 'Concise statement' },
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
