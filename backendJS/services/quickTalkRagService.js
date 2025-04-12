// server/services/quickTalkRAGService.js
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';

export const quickTalkRAGService = {
  // 原先只检索文件 store 的方法，保留以免破坏其他地方引用
  async quickTalkRAG(question, store) {
    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const prompt = PromptTemplate.fromTemplate(`
    Use the following pieces of context to answer the question at the end.
    If you don't know, just say "I don't know."
    
    {context}
    Question: {question}
    Answer:
    `);

    const chain = RetrievalQAChain.fromLLM(model, store.asRetriever(), {
      prompt,
    });
    const response = await chain.call({ query: question });
    return response.text;
  },

  /**
   * 新增: quickTalkRAGMultiSource
   *   - 同时使用 conversationDocs & fileStore 做上下文
   */
  async quickTalkRAGMultiSource(question, store, conversationDocs = []) {
    // 1) 用 file store 做相似度检索
    const fileDocs = await store.similaritySearch(question, 3);

    // 2) 合并 conversationDocs + fileDocs
    const allDocs = [...conversationDocs, ...fileDocs];

    // 3) 拼成大文本 context
    //    为了可读性，可以在 metadata 里显示它来自对话(role=user/assistant)还是文件(rowIndex/reference等)
    const context = allDocs
      .map((doc, idx) => {
        const roleInfo = doc.metadata?.role ? `Role: ${doc.metadata.role}` : '';
        return `--- Doc #${idx + 1} ---\n${roleInfo}\n${doc.pageContent}`;
      })
      .join('\n\n');

    // 4) 构建 prompt
    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // 这里我们不再用 store.asRetriever()，而是自定义
    // 用 "getRelevantDocuments" 返回 allDocs 即可
    const chain = RetrievalQAChain.fromLLM(
      model,
      { getRelevantDocuments: async () => allDocs },
      {
        prompt: PromptTemplate.fromTemplate(`
Use the following pieces of context (from both conversation memory and file content) to answer the question.
If you don't know or it's not mentioned, just say "I don't know."

Context:
${context}

User Question: {question}
Answer:
        `),
      }
    );

    // 5) 执行 LLM
    const response = await chain.call({ query: question });
    return response.text;
  },
};
