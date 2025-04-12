// server/services/multiRAGService.js

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

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
