// server/controllers/conversationController.js
import { conversationService } from '../services/conversationService.js';

export const conversationController = {
  // POST /conversation/memory
  async saveMessage(req, res) {
    try {
      const { docId, role, text } = req.body;
      if (!docId || !text) {
        return res.status(400).json({ error: 'Missing docId or text' });
      }
      await conversationService.saveMessage(docId, role, text);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET /conversation/memory?sessionId=xxx&query=xxx&docId=xxx
  async retrieveMessages(req, res) {
    try {
      const { docId, query, topK } = req.query;
      if (!docId || !query) {
        return res.status(400).json({ error: 'Missing docId or query' });
      }
      const docs = await conversationService.retrieveMessages(
        docId,
        query,
        Number(topK) || 40
      );
      res.json({ docs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};
