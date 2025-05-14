import express from 'express';
import { fileController } from '../controllers/fileController.js';

export const fileRoutes = express.Router();

/**
 * 小工具: 强制检查 query.sessionId
 *   - 如果不存在 => 返回 400
 *   - 否则 next()
 */
function requireSessionId(req, res, next) {
  if (!req.query.sessionId) {
    return res.status(400).json({ error: 'Missing ?sessionId=' });
  }
  next();
}

/**
 * A) GET /files/list?userId=xxx
 *    - 先 requireUserId
 *    - 再 fileController.listFiles
 */
fileRoutes.get('/list', requireSessionId, fileController.listFiles);

/**
 * B) POST /files/upload?sessionId=xxx
 */
fileRoutes.post('/upload', requireSessionId, fileController.uploadFile);

/**
 * C) PATCH /files/:fileKey?sessionId=xxx
 */
fileRoutes.patch('/:fileKey', requireSessionId, fileController.updateFile);

/**
 * D) DELETE /files/:fileKey?sessionId=xxx
 */
fileRoutes.delete('/:fileKey', requireSessionId, fileController.deleteFile);

/**
 * E) POST /files/:fileKey/mapColumns?sessionId=xxx
 */
fileRoutes.post(
  '/:fileKey/mapColumns',
  requireSessionId,
  fileController.mapColumns
);

/**
 * F) GET /files/:fileKey/columns?sessionId=xxx
 */
fileRoutes.get(
  '/:fileKey/columns',
  requireSessionId,
  fileController.getColumns
);

/**
 * G) POST /files/:fileKey/buildStore?sessionId=xxx
 */
fileRoutes.post(
  '/:fileKey/buildStore',
  requireSessionId,
  fileController.buildStore
);

/**
 * H) GET /files/loadDemo?demoName=xxx&sessionId=xxx
 */
fileRoutes.get('/loadDemo', requireSessionId, fileController.loadDemo);

/**
 * I) GET /files/loadAllDemos?sessionId=xxx
 */
fileRoutes.get('/loadAllDemos', requireSessionId, fileController.loadAllDemos);
