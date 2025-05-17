// backendJS/controllers/sessionController.js
import fs from 'fs';
import path from 'path';
import { workflowMap } from './essentialWorkflowController.js';
import { sessionStores } from '../services/conversationService.js';
import { userFileRegistry } from '../services/fileService.js';
import { uploadsDir } from '../services/fileService.js';

export const sessionController = {
  /**
   * DELETE /session?sessionId=xxx
   * Delete all data associated with a session:
   * - files in uploads directory
   * - file registry records
   * - workflow state
   * - conversation history
   */
  async deleteSession(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }

      // 1. Delete uploaded files from disk
      const registry = userFileRegistry[sessionId];
      if (registry) {
        const fileKeys = Object.keys(registry);
        for (const fileKey of fileKeys) {
          const filePath = registry[fileKey].localPath;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // 2. Clear file registry
      delete userFileRegistry[sessionId];

      // 3. Clear workflow state
      delete workflowMap[sessionId];

      // 4. Clear conversation history
      delete sessionStores[sessionId];

      res.json({ message: 'Session deleted successfully' });
    } catch (err) {
      console.error('Error deleting session:', err);
      res.status(500).json({ error: err.message });
    }
  },
};
