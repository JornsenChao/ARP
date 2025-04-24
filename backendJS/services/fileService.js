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

export const fileService = {
  listAllFiles() {
    return Object.keys(fileRegistry).map((fileKey) => {
      const {
        fileName,
        tags,
        fileType,
        storeBuilt,
        columnSchema, // 新字段：数组
        createdAt,
        lastBuildAt,
        mapAndBuildMethod,
        memoryStore,
        docType, // 新增: caseStudy, strategy, otherResource
      } = fileRegistry[fileKey];
      return {
        fileKey,
        fileName,
        tags,
        fileType,
        storeBuilt,
        columnSchema,
        createdAt,
        lastBuildAt,
        mapAndBuildMethod,
        docType,
      };
    });
  },

  /**
   * handleUploadFile
   *  - 增加 docType
   */
  handleUploadFile(file, tagsRaw, docType) {
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
      docType: docType || 'otherResource', // 缺省为otherResource
      fileType: ext,
      localPath: file.path,
      storeBuilt: false,
      columnSchema: null,
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

  /**
   * updateFileInfo
   *  - 可更新 newName, tags, docType
   */
  updateFileInfo(fileKey, newName, newTags, newDocType) {
    const rec = fileRegistry[fileKey];
    if (!rec) return null;
    if (newName) {
      rec.fileName = newName;
    }
    if (newTags) {
      rec.tags = Array.isArray(newTags) ? newTags : [newTags];
    }
    if (newDocType) {
      rec.docType = newDocType;
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

  /**
   * mapColumns:
   *   body.columnSchema = [
   *     { columnName, infoCategory, metaCategory },
   *     ...
   *   ]
   */
  mapColumns(fileKey, columnSchema) {
    const rec = fileRegistry[fileKey];
    if (!rec) throw new Error('File not found');
    if (!['.csv', '.xlsx', '.xls'].includes(rec.fileType)) {
      throw new Error('Not a CSV/XLSX file, cannot map columns');
    }

    // 存储
    rec.columnSchema = columnSchema; // 直接保存
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
        if (!rec.columnSchema) {
          throw new Error('Need columnSchema first (mapColumns).');
        }
        const records = parseTable(rec.localPath);
        // columnSchema: [{ columnName, infoCategory, metaCategory }, ...]
        // 对于每行 row => 把各列的值收集起来
        docs = [];

        records.forEach((row, rowIdx) => {
          // 构建一个 metadata 对象，以保存列值 + infoCategory + metaCategory
          const colDataArray = rec.columnSchema.map((colInfo) => {
            const rawVal = row[colInfo.columnName] || '';
            return {
              colName: colInfo.columnName,
              infoCategory: colInfo.infoCategory || '',
              metaCategory: colInfo.metaCategory || '',
              cellValue: sanitizeCellValue(rawVal),
            };
          });

          // 可以决定：将全部列拼成一个 pageContent, 或者只用 strategy-like列？
          // 这里示例：把全部列合并成文本
          let combinedText = '';
          colDataArray.forEach((cd) => {
            combinedText += `[${cd.colName} - ${cd.infoCategory}/${cd.metaCategory}]: ${cd.cellValue}\n`;
          });

          docs.push({
            pageContent: combinedText,
            metadata: {
              rowIndex: rowIdx,
              columnData: colDataArray,
              docType: rec.docType, // file-level
              fileName: rec.fileName,
            },
          });
        });
      } else {
        // pdf/txt
        docs = await embeddingsService.loadAndSplitDocumentsByType(
          rec.localPath
        );
        // 给pdf/txt的metadata里也可以加 docType
        docs.forEach((d) => {
          d.metadata.docType = rec.docType;
          d.metadata.fileName = rec.fileName;
        });
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
      docType: 'otherResource', // default
      fileType: ext,
      localPath: uploadPath,
      storeBuilt: false,
      columnSchema: null,
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
