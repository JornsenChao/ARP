import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTable } from '../utils/parseUtils.js';
import { sanitizeCellValue } from '../utils/stringCleaner.js';
import { embeddingsService } from './embeddingsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局保存在内存
const fileRegistry = {};
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --------- 定义 service ----------- //
export const fileService = {
  listAllFiles() {
    return Object.keys(fileRegistry).map((fileKey) => {
      const {
        fileName,
        tags,
        fileType,
        storeBuilt,
        columnMap,
        createdAt,
        lastBuildAt,
        mapAndBuildMethod,
      } = fileRegistry[fileKey];
      return {
        fileKey,
        fileName,
        tags,
        fileType,
        storeBuilt,
        columnMap,
        createdAt,
        lastBuildAt,
        mapAndBuildMethod,
      };
    });
  },

  handleUploadFile(file, tagsRaw) {
    // 1) 检查是否已有同名文件
    const existing = Object.values(fileRegistry).find(
      (rec) => rec.fileName === file.originalname
    );
    if (existing) {
      // 直接抛出错误，或自定义Error类型
      throw new Error(
        `File name "${file.originalname}" already exists. 
       Please delete it first or rename the new file.`
      );
    }
    const tags = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw].filter(Boolean);
    const fileKey = Date.now().toString() + '_' + file.originalname;
    const ext = path.extname(file.originalname).toLowerCase();
    const nowISO = new Date().toISOString();

    fileRegistry[fileKey] = {
      fileName: file.originalname,
      tags,
      fileType: ext,
      localPath: file.path,
      storeBuilt: false,
      columnMap: null,
      createdAt: nowISO,
      lastBuildAt: null,
      mapAndBuildMethod: null,
      memoryStore: null,
    };

    return {
      fileKey,
      message: `File ${file.originalname} uploaded and registered.`,
    };
  },

  updateFileInfo(fileKey, newName, newTags) {
    const rec = fileRegistry[fileKey];
    if (!rec) return null;
    if (newName) {
      rec.fileName = newName;
    }
    if (newTags) {
      rec.tags = Array.isArray(newTags) ? newTags : [newTags];
    }
    return rec;
  },

  deleteFile(fileKey) {
    const rec = fileRegistry[fileKey];
    if (!rec) throw new Error('File not found');
    if (fs.existsSync(rec.localPath)) {
      fs.unlinkSync(rec.localPath);
    }
    delete fileRegistry[fileKey];
  },

  mapColumns(fileKey, columnMap) {
    const rec = fileRegistry[fileKey];
    if (!rec) throw new Error('File not found');
    if (!['.csv', '.xlsx', '.xls'].includes(rec.fileType)) {
      throw new Error('Not a CSV/XLSX file, cannot map columns');
    }
    rec.columnMap = columnMap;
    rec.storeBuilt = false;
  },

  getColumns(fileKey) {
    const rec = fileRegistry[fileKey];
    if (!rec) throw new Error('File not found');
    if (!['.csv', '.xlsx', '.xls'].includes(rec.fileType)) {
      throw new Error('Not a CSV/XLSX file, cannot get columns');
    }
    const records = parseTable(rec.localPath);
    if (!records || records.length === 0) return [];
    return Object.keys(records[0]);
  },

  async buildStore(fileKey) {
    const rec = fileRegistry[fileKey];
    if (!rec) throw new Error(`File ${fileKey} not found`);
    const ext = rec.fileType;

    let docs = [];
    if (['.pdf', '.txt', '.csv', '.xlsx', '.xls'].includes(ext)) {
      if (['.csv', '.xlsx', '.xls'].includes(ext)) {
        // 先 parse -> row -> docs(pageContent, metadata)
        if (!rec.columnMap) throw new Error('Need columnMap first');
        const records = parseTable(rec.localPath);
        const { dependencyCol, strategyCol, referenceCol } = rec.columnMap;
        docs = [];

        records.forEach((row, rowIdx) => {
          const depText = dependencyCol
            .map((col) => sanitizeCellValue(row[col] || ''))
            .join(', ');
          const refText = referenceCol
            .map((col) => sanitizeCellValue(row[col] || ''))
            .join(', ');
          const strategyText = strategyCol
            .map((col) => sanitizeCellValue(row[col] || ''))
            .join('\n');

          docs.push({
            pageContent: strategyText,
            metadata: {
              rowIndex: rowIdx,
              dependency: depText,
              reference: refText,
            },
          });
        });
      } else {
        // pdf/txt
        docs = await embeddingsService.loadAndSplitDocumentsByType(
          rec.localPath
        );
      }
    } else {
      throw new Error(`Unsupported file ext: ${ext}`);
    }

    // 构建向量索引
    const store = await embeddingsService.buildMemoryVectorStore(docs);
    rec.memoryStore = store;
    rec.storeBuilt = true;
    rec.lastBuildAt = new Date().toISOString();
    rec.mapAndBuildMethod = 'OpenAIEmbeddings'; // or something

    if (fs.existsSync(rec.localPath)) {
      fs.unlinkSync(rec.localPath);
    }
    rec.localPath = null; // or set to null, 以表示已删除

    return {
      message: `Memory store built for fileKey=${fileKey}`,
      docCount: docs.length,
    };
  },

  loadDemo(demoName) {
    // 这里可根据你的实际路径
    const demoDir = path.join(__dirname, '../demo_docs');
    const demoFilePath = path.join(demoDir, demoName);
    if (!fs.existsSync(demoFilePath)) {
      return null;
    }
    const newFileKey = Date.now().toString() + '_' + demoName;
    const uploadPath = path.join(uploadsDir, newFileKey);
    fs.copyFileSync(demoFilePath, uploadPath);

    const ext = path.extname(demoName).toLowerCase();
    const nowISO = new Date().toISOString();

    fileRegistry[newFileKey] = {
      fileName: demoName,
      tags: ['demo'],
      fileType: ext,
      localPath: uploadPath,
      storeBuilt: false,
      columnMap: null,
      createdAt: nowISO,
      lastBuildAt: null,
      mapAndBuildMethod: null,
      memoryStore: null,
    };

    return {
      fileKey: newFileKey,
      message: `Demo ${demoName} loaded as fileKey=${newFileKey}`,
    };
  },

  // ========== 提供存取 memoryStore 的函数 ========== //
  getMemoryStore(fileKey) {
    const rec = fileRegistry[fileKey];
    if (!rec || !rec.storeBuilt || !rec.memoryStore) return null;
    return rec.memoryStore;
  },

  getStoresByKeys(fileKeys) {
    // 如果 fileKeys 为空，则默认用全部 storeBuilt == true 的
    let targetKeys = fileKeys;
    if (!targetKeys || targetKeys.length === 0) {
      targetKeys = Object.keys(fileRegistry).filter(
        (k) => fileRegistry[k].storeBuilt === true
      );
    }
    const stores = [];
    for (const fk of targetKeys) {
      const s = this.getMemoryStore(fk);
      if (s) stores.push(s);
    }
    return stores;
  },
};
