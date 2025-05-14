import { fileService } from '../services/fileService.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// 配置 multer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads'); // 如果要统一放 /server/uploads

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

export const fileController = {
  // GET /files/list?sessionId=xxx
  async listFiles(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const list = fileService.listAllFiles(sessionId);
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },
  // POST /files/upload?sessionId=xxx
  uploadFile: [
    // 先用multer处理上传
    upload.single('file'),
    async (req, res) => {
      try {
        const { sessionId } = req.query;
        if (!sessionId) {
          return res.status(400).json({ error: 'Missing ?sessionId=' });
        }
        const { tags, docType } = req.body;
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const result = fileService.handleUploadFile(
          sessionId,
          file,
          tags,
          docType
        );
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(409).json({ error: err.message });
      }
    },
  ],

  // PATCH /files/:fileKey?userId=xxx
  async updateFile(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const { fileKey } = req.params;
      const { newName, tags, docType } = req.body;
      const updated = fileService.updateFileInfo(
        sessionId,
        fileKey,
        newName,
        tags,
        docType
      );
      if (!updated) return res.status(404).send('File not found');
      res.json({ message: 'File updated', data: updated });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // DELETE /files/:fileKey?userId=xxx
  async deleteFile(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const { fileKey } = req.params;
      fileService.deleteFile(sessionId, fileKey);
      return res.json({ message: `File ${fileKey} deleted.` });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /files/:fileKey/mapColumns?userId=xxx
  async mapColumns(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const { fileKey } = req.params;
      const { columnSchema } = req.body;
      fileService.mapColumns(sessionId, fileKey, columnSchema);
      res.json({ message: 'Column map saved', columnSchema });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // GET /files/:fileKey/columns?userId=xxx
  async getColumns(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const { fileKey } = req.params;
      const columns = fileService.getColumns(sessionId, fileKey);
      res.json(columns);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /files/:fileKey/buildStore?userId=xxx
  async buildStore(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const { fileKey } = req.params;
      const result = await fileService.buildStore(sessionId, fileKey);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // GET /files/loadDemo?demoName=xxx&userId=xxx
  async loadDemo(req, res) {
    try {
      const { sessionId, demoName } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      if (!demoName) {
        return res.status(400).send('Missing demoName param');
      }
      const result = fileService.loadDemo(sessionId, demoName);
      if (!result) {
        return res.status(404).send(`Demo file ${demoName} not found.`);
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // GET /files/loadAllDemos?userId=xxx
  async loadAllDemos(req, res) {
    try {
      const { sessionId } = req.query;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing ?sessionId=' });
      }
      const result = await fileService.loadAllDemos(sessionId);
      res.json(result); // 返回加载详情
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },
};
