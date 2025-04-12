import { quickTalkRAGService } from '../services/quickTalkRAGService.js';
import { fileService } from '../services/fileService.js';
import { conversationService } from '../services/conversationService.js';

export const quickTalkRAGController = {
  /**
   * GET /conversation/quicktalk?question=xx&fileKey=xx&sessionId=xxx
   *   - fileKey: 表示用户所选文件
   *   - sessionId: 区分用户会话
   */
  async quickTalkChat(req, res) {
    try {
      console.log('quickTalkChat req.query=', req.query);
      const { question, fileKey, sessionId } = req.query;
      if (!fileKey) {
        return res
          .status(400)
          .send({ error: 'No fileKey specified. Please select a file first.' });
      }
      // 如果 sessionId 没有传，则可以给个警告或者默认值
      if (!sessionId) {
        return res.status(400).send({ error: 'sessionId is not defined!!!' });
      }
      // 获取文件对应的向量存储
      const store = fileService.getMemoryStore(fileKey);
      if (!store) {
        return res.status(404).send({ error: 'File not found or not built' });
      }
      // ========== 1) conversation memory: 检索对话上下文 ==========
      let conversationDocs = [];
      if (sessionId) {
        // 根据当前问题，在对话向量库里检索 topK=20 条最相似记录
        conversationDocs = await conversationService.retrieveMessages(
          sessionId,
          question,
          20
        );
      }

      // ========== 2) 同时进行文件RAG ==========
      // 注意：我们把文件检索逻辑移动到新的 quickTalkRAGMultiSource 中，也可以在这里做
      // 下面直接把 conversationDocs 传给 quickTalkRAGMultiSource
      const answer = await quickTalkRAGService.quickTalkRAGMultiSource(
        question,
        store,
        conversationDocs
      );

      res.send(answer); // 直接返回string
    } catch (error) {
      console.error('Error in /conversation/quicktalk:', error);
      res.status(500).send({ error: error.message });
    }
  },
};
