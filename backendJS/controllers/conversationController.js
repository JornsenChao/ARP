// server/controllers/conversationController.js
import { conversationService } from '../services/conversationService.js';

export const conversationController = {
  // POST /conversation/memory
  async saveMessage(req, res) {
    try {
      const { sessionId, role, text } = req.body;
      if (!sessionId || !text) {
        return res.status(400).json({ error: 'Missing sessionId or text' });
      }
      await conversationService.saveMessage(sessionId, role, text);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  // GET /conversation/memory?sessionId=xxx&query=xxx
  async retrieveMessages(req, res) {
    try {
      const { sessionId, query, topK } = req.query;
      if (!sessionId || !query) {
        return res.status(400).json({ error: 'Missing sessionId or query' });
      }
      const docs = await conversationService.retrieveMessages(
        sessionId,
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
