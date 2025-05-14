import { quickTalkRAGService } from '../services/quickTalkRAGService.js';
import { fileService } from '../services/fileService.js';
import { conversationService } from '../services/conversationService.js';

export const quickTalkRAGController = {
  /**
   * GET /conversation/quicktalk?question=xx&fileKey=xx&sessionId=xxx&docId=xxx
   *   - fileKey: 表示用户所选文件
   *   - sessionId: 用户会话标识
   *   - docId: 文档对话标识
   */
  async quickTalkChat(req, res) {
    try {
      console.log('quickTalkChat req.query=', req.query);
      const { question, fileKey, sessionId, docId } = req.query;
      if (!fileKey) {
        return res
          .status(400)
          .send({ error: 'No fileKey specified. Please select a file first.' });
      }
      if (!sessionId) {
        return res.status(400).send({ error: 'sessionId is not defined!' });
      }
      if (!docId) {
        return res.status(400).send({ error: 'docId is not defined!' });
      }

      // 获取文件对应的向量存储 (使用 sessionId 因为这是用户级别的文件访问)
      const store = fileService.getMemoryStore(sessionId, fileKey);
      if (!store) {
        return res.status(404).send({ error: 'File not found or not built' });
      }

      // 检索对话上下文 (使用 docId 因为这是单个文档的对话)
      let conversationDocs = await conversationService.retrieveMessages(
        docId,
        question,
        20
      );

      // 同时进行文件RAG
      const answer = await quickTalkRAGService.quickTalkRAGMultiSource(
        question,
        store,
        conversationDocs
      );

      res.send(answer);
    } catch (error) {
      console.error('Error in /conversation/quicktalk:', error);
      res.status(500).send({ error: error.message });
    }
  },
};
