// server/services/conversationService.js
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';

// 在这里维护一个 { sessionId -> MemoryVectorStore } 的映射
const sessionStores = {};

export const conversationService = {
  /**
   * 把一段对话(文本)嵌入并存储到对应 sessionId 的向量库中
   * @param {string} sessionId - 可以是“前端生成的会话ID”
   * @param {string} role - "user" | "assistant" 等
   * @param {string} text - 对话内容
   */
  async saveMessage(sessionId, role, text) {
    if (!sessionStores[sessionId]) {
      // 首次创建 MemoryVectorStore
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      sessionStores[sessionId] = await MemoryVectorStore.fromTexts(
        [], // 初始为空
        [],
        embeddings
      );
    }
    const store = sessionStores[sessionId];
    // 将这段文本包装成 langchain Document
    const doc = new Document({
      pageContent: text,
      metadata: { role, createdAt: new Date().toISOString() },
    });
    // 将doc插入 store
    await store.addDocuments([doc]);
  },

  /**
   * 从 sessionId 对应的向量库检索若干“最相关”对话片段
   * @param {string} sessionId
   * @param {string} query
   * @param {number} topK
   */
  async retrieveMessages(sessionId, query, topK = 20) {
    const store = sessionStores[sessionId];
    if (!store) return [];
    // 相似度检索
    const docs = await store.similaritySearch(query, topK);
    return docs; // [{pageContent, metadata}, ...]
  },
};
