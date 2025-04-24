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
  // GET /files/list
  async listFiles(req, res) {
    try {
      const list = fileService.listAllFiles();
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /files/upload
  uploadFile: [
    // 先用multer处理上传
    upload.single('file'),
    async (req, res) => {
      try {
        const { tags, docType } = req.body; // <--- docType: "caseStudy" | "strategy" | "otherResource"
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        // 将 docType、tags 传递给 service
        const result = fileService.handleUploadFile(file, tags, docType);
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(409).json({ error: err.message });
      }
    },
  ],

  // PATCH /files/:fileKey
  async updateFile(req, res) {
    try {
      const { fileKey } = req.params;
      const { newName, tags, docType } = req.body;
      const updated = fileService.updateFileInfo(
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

  // DELETE /files/:fileKey
  async deleteFile(req, res) {
    try {
      const { fileKey } = req.params;
      fileService.deleteFile(fileKey);
      return res.json({ message: `File ${fileKey} deleted.` });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /files/:fileKey/mapColumns
  async mapColumns(req, res) {
    try {
      const { fileKey } = req.params;
      // 假设 body={ columnSchema: [ { columnName, infoCategory, metaCategory }, ... ] }
      const { columnSchema } = req.body;
      fileService.mapColumns(fileKey, columnSchema);
      res.json({ message: 'Column map saved', columnSchema });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // GET /files/:fileKey/columns
  async getColumns(req, res) {
    try {
      const { fileKey } = req.params;
      const columns = fileService.getColumns(fileKey);
      res.json(columns);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /files/:fileKey/buildStore
  async buildStore(req, res) {
    try {
      const { fileKey } = req.params;
      const result = await fileService.buildStore(fileKey);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // GET /files/loadDemo
  async loadDemo(req, res) {
    try {
      const { demoName } = req.query;
      if (!demoName) {
        return res.status(400).send('Missing demoName param');
      }
      const result = fileService.loadDemo(demoName);
      if (!result) {
        return res.status(404).send(`Demo file ${demoName} not found.`);
      }
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },
};
