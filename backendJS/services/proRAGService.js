// server/services/proRAGService.js

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

/**
 * ProRAGService: 专门处理 CSV/XLSX 表格场景下，依赖/参考/策略的 RAG 查询。
 *  - proRAGQuery: 普通模式
 *  - proRAGQueryCoT: 带 CoT
 */
export const proRAGService = {
  /**
   * proRAGQuery:
   *   - 传入 memoryStore, dependencyData, userQuery, language, customFields
   *   - 做 similaritySearch => 生成定制化的 Markdown 输出
   */
  async proRAGQuery(
    store,
    dependencyData,
    userQuery,
    language = 'en',
    customFields = []
  ) {
    // 1) 组合用户上下文
    const combinedQuery = combineDependencyUserQuery(
      dependencyData,
      userQuery,
      customFields
    );

    // 2) 相似度检索
    const docs = await store.similaritySearch(combinedQuery, 15);

    // 3) 构建 Prompt
    const langPrompt = getLanguagePrompt(language);
    const context = docs
      .map(
        (d, idx) => `
---- Doc #${idx + 1} ---
strategy: ${d.pageContent}
dependency: ${d.metadata.dependency}
reference: ${d.metadata.reference}
`
      )
      .join('\n');

    const template = `
You are an expert. ${langPrompt}

We found these doc chunks. Each chunk has:
- A doc number: "Doc #x"
- A strategy
- A dependency
- A reference

${context}

**Your Task**:
Produce the final answer in Markdown, but do NOT show "Doc #X" in the final output.
For each chunk, print:
1) "## Strategy #N"
2) "### Strategy"
3) "### Dependency"
4) "### Reference"
(Then the text from the chunk)

User question:
${userQuery}
`;

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
    });
    const chain = RetrievalQAChain.fromLLM(model, store.asRetriever(), {
      prompt: PromptTemplate.fromTemplate(template),
    });
    const response = await chain.call({ query: combinedQuery });

    return {
      answer: response.text,
      usedPrompt: template,
      docs,
    };
  },

  /**
   * proRAGQueryCoT: 含 CoT 提示。
   */
  async proRAGQueryCoT(
    store,
    dependencyData,
    userQuery,
    language = 'en',
    customFields = []
  ) {
    const combinedQuery = combineDependencyUserQuery(
      dependencyData,
      userQuery,
      customFields
      // true
    );

    const docs = await store.similaritySearch(combinedQuery, 15);

    const langPrompt = getLanguagePrompt(language, true); // 'Answer in xx.'
    const context = docs
      .map((d, idx) => `Doc#${idx + 1}: ${d.pageContent}`)
      .join('\n');

    const template = `
You are an expert. We want chain-of-thought.
${langPrompt}

Relevant docs:
${context}

Question:
${userQuery}
`;

    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL,
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
    });

    const chain = RetrievalQAChain.fromLLM(model, store.asRetriever(), {
      prompt: PromptTemplate.fromTemplate(template),
    });
    const response = await chain.call({ query: combinedQuery });
    return {
      answer: response.text,
      usedPrompt: template,
    };
  },
};

// ========== 辅助函数 ========== //
function combineDependencyUserQuery(
  dependencyData,
  userQuery,
  customFields,
  isCoT
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
    if (cf.fieldType === 'reference') refTexts.push(cf.fieldValue);
    if (cf.fieldType === 'strategy') strTexts.push(cf.fieldValue);
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
