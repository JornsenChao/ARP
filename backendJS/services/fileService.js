import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTable } from '../utils/parseUtils.js';
import { sanitizeCellValue } from '../utils/stringCleaner.js';
import { embeddingsService } from './embeddingsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// "总" Registry: { sessionId -> { fileKey -> fileObj } }
export const userFileRegistry = {};
// 全局保存在内存
// const fileRegistry = {};
export const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// helper: 获取(或创建) user 的 fileRegistry
function getOrCreateUserRegistry(sessionId) {
  if (!userFileRegistry[sessionId]) {
    userFileRegistry[sessionId] = {};
  }
  return userFileRegistry[sessionId];
}

export const fileService = {
  listAllFiles(sessionId) {
    const reg = getOrCreateUserRegistry(sessionId);
    return Object.keys(reg).map((fileKey) => {
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
      } = reg[fileKey];
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
  // === 2) handleUploadFile(sessionId, file, tags, docType)
  handleUploadFile(sessionId, file, tagsRaw, docType) {
    const registry = getOrCreateUserRegistry(sessionId);
    // 1) 检查是否已有同名
    const existing = Object.values(registry).find(
      (rec) => rec.fileName === file.originalname
    );
    if (existing) {
      throw new Error(`File name "${file.originalname}" already exists.`);
    }
    const tags = Array.isArray(tagsRaw) ? tagsRaw : [tagsRaw].filter(Boolean);
    const fileKey = Date.now().toString() + '_' + file.originalname;
    const ext = path.extname(file.originalname).toLowerCase();
    const nowISO = new Date().toISOString();

    registry[fileKey] = {
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
  updateFileInfo(sessionId, fileKey, newName, newTags, newDocType) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
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

  deleteFile(sessionId, fileKey) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
    if (!rec) throw new Error('File not found');
    if (fs.existsSync(rec.localPath)) {
      fs.unlinkSync(rec.localPath);
    }
    delete registry[fileKey];
  },

  /**
   * mapColumns:
   *   body.columnSchema = [
   *     { columnName, infoCategory, metaCategory },
   *     ...
   *   ]
   */
  mapColumns(sessionId, fileKey, columnSchema) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
    if (!rec) throw new Error('File not found');
    if (!['.csv', '.xlsx', '.xls'].includes(rec.fileType)) {
      throw new Error('Not a CSV/XLSX file, cannot map columns');
    }

    // 存储
    rec.columnSchema = columnSchema; // 直接保存
    rec.storeBuilt = false;
  },

  getColumns(sessionId, fileKey) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
    if (!rec) throw new Error('File not found');
    if (!['.csv', '.xlsx', '.xls'].includes(rec.fileType)) {
      throw new Error('Not a CSV/XLSX file, cannot get columns');
    }
    const records = parseTable(rec.localPath);
    if (!records || records.length === 0) return [];
    return Object.keys(records[0]);
  },

  async buildStore(sessionId, fileKey) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
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

  loadDemo(sessionId, demoName) {
    const registry = getOrCreateUserRegistry(sessionId);
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

    registry[newFileKey] = {
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

  /**
   * loadAllDemos(sessionId)
   *   - 读取 demo_config.json, 把里面列的文件一并复制+build
   */
  async loadAllDemos(sessionId) {
    const registry = getOrCreateUserRegistry(sessionId);
    try {
      const demoDir = path.join(__dirname, '../demo_docs');
      // 1) 找到 demo_config.json
      const configPath = path.join(demoDir, 'demo_config.json');
      if (!fs.existsSync(configPath)) {
        throw new Error(`demo_config.json not found in ${demoDir}`);
      }
      const rawConfig = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(rawConfig);

      // config.files 是一个数组：[{ fileName, docType, columnSchema?... }, ...]
      if (!Array.isArray(config.files)) {
        throw new Error('demo_config.json must have "files" array');
      }

      const loaded = [];
      for (const item of config.files) {
        const { fileName, docType, columnSchema } = item;
        if (!fileName) {
          console.warn('Skipping item with no fileName');
          continue;
        }
        // 2) 在 demo_docs 找 fileName
        const srcPath = path.join(demoDir, fileName);
        if (!fs.existsSync(srcPath)) {
          console.warn(`File ${fileName} not found in demo_docs`);
          continue;
        }
        // 3) copy to uploads
        const ext = path.extname(fileName).toLowerCase();
        const newFileKey = Date.now().toString() + '_' + fileName;
        const destPath = path.join(uploadsDir, newFileKey);
        fs.copyFileSync(srcPath, destPath);

        const nowISO = new Date().toISOString();
        // 4) registry
        registry[newFileKey] = {
          fileName,
          tags: ['demo'],
          docType: docType || 'otherResource',
          fileType: ext,
          localPath: destPath,
          storeBuilt: false,
          columnSchema: columnSchema || null,
          createdAt: nowISO,
          lastBuildAt: null,
          mapAndBuildMethod: null,
          memoryStore: null,
        };

        // 5) 如果是 csv/xlsx 并有 columnSchema => 直接 buildStore
        // 否则若pdf/txt => 也buildStore
        let buildMsg = null;
        if (['.csv', '.xlsx', '.xls', '.pdf', '.txt'].includes(ext)) {
          // 调用 buildStore
          // 这里可复用 your buildStore logic
          // 先set columnSchema
          if (['.csv', '.xlsx', '.xls'].includes(ext) && columnSchema) {
            registry[newFileKey].columnSchema = columnSchema;
          }
          // 调用 buildStore
          const result = await this.buildStore(sessionId, newFileKey);
          buildMsg = `Store built for docType=${docType || 'otherResource'}`;
        } else {
          buildMsg = `Skip build for ext=${ext}`;
        }

        loaded.push({
          fileKey: newFileKey,
          message: `Loaded & built store for ${fileName}`,
          buildMsg,
        });
      }

      return loaded;
    } catch (err) {
      console.error('loadAllDemos error:', err);
      throw err;
    }
  },

  /**
   * getMemoryStore(sessionId, fileKey)
   *   - 返回本文件对应的 memoryStore
   */
  getMemoryStore(sessionId, fileKey) {
    const registry = getOrCreateUserRegistry(sessionId);
    const rec = registry[fileKey];
    if (!rec || !rec.storeBuilt || !rec.memoryStore) return null;
    return rec.memoryStore;
  },

  /**
   * getStoresByKeys(sessionId, fileKeys)
   *   - 如果 fileKeys 为空 => 返回 sessionId 下 所有 storeBuilt 的 store
   *   - 否则仅返回用户选定的keys
   */
  getStoresByKeys(sessionId, fileKeys) {
    const registry = getOrCreateUserRegistry(sessionId);
    let targetKeys = fileKeys;
    if (!targetKeys || targetKeys.length === 0) {
      // 取全部 storeBuilt == true
      targetKeys = Object.keys(registry).filter(
        (k) => registry[k].storeBuilt === true
      );
    }
    const stores = [];
    for (const fk of targetKeys) {
      const rec = registry[fk];
      if (rec && rec.storeBuilt && rec.memoryStore) {
        stores.push(rec.memoryStore);
      }
    }
    return stores;
  },
};
