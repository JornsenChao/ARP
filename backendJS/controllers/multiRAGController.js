// backendJS/controllers/multiRAGController.js

import { multiRAGService } from '../services/multiRAGService.js';
import { fileService } from '../services/fileService.js';
import { graphService } from '../services/graphService.js';

export const multiRAGController = {
  // POST /multiRAG/query
  async multyRAGQuery(req, res) {
    try {
      const {
        fileKeys = [],
        dependencyData,
        userQuery,
        language,
        customFields,
        docType, // <--- NEW
      } = req.body;

      // 1) 如果有 docType，则只允许检索 docType==xx 的文件
      let targetFileKeys = [];
      if (docType) {
        // listAllFiles => filter by docType => storeBuilt => get their fileKeys
        const allFiles = fileService.listAllFiles();
        const matched = allFiles.filter(
          (f) => f.docType === docType && f.storeBuilt === true
        );
        const matchedKeys = matched.map((m) => m.fileKey);

        // 决定一下策略：
        // - (A) 取 "matchedKeys ∩ fileKeys" 交集
        // - (B) 直接用 matchedKeys, 不管 fileKeys
        // 下面示例用 (A):
        const intersectKeys = fileKeys.length
          ? matchedKeys.filter((k) => fileKeys.includes(k))
          : matchedKeys;

        if (intersectKeys.length === 0) {
          return res.json({
            docs: [],
            answer: '',
            usedPrompt: 'No files matched docType or no fileKeys provided.',
          });
        }
        targetFileKeys = intersectKeys;
      } else {
        // 如果 docType 未提供，则直接用 fileKeys(或空则表示全部?)
        if (fileKeys.length > 0) {
          targetFileKeys = fileKeys;
        } else {
          // 如果啥都没传 => 也可表示 "全库"
          const allBuilt = fileService
            .listAllFiles()
            .filter((f) => f.storeBuilt === true)
            .map((f) => f.fileKey);
          targetFileKeys = allBuilt;
        }
      }

      // 2) 从 fileService 获取 memoryStores
      const stores = fileService.getStoresByKeys(targetFileKeys);
      if (stores.length === 0) {
        return res.json({
          docs: [],
          answer: '',
          usedPrompt: 'No store available for the given docType / fileKeys.',
        });
      }

      // 3) 调用 multiRAGService
      const result = await multiRAGService.multiRAGQuery(
        stores,
        dependencyData,
        userQuery,
        language,
        customFields
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /multiRAG/queryCoT
  async multyRAGQueryCoT(req, res) {
    try {
      const {
        fileKeys = [],
        dependencyData,
        userQuery,
        language,
        customFields,
      } = req.body;
      // 这里如果也需要 docType 强制限制，可以重复上面相同逻辑
      // for brevity, omitted
      const stores = fileService.getStoresByKeys(fileKeys);
      const result = await multiRAGService.multiRAGQueryCoT(
        stores,
        dependencyData,
        userQuery,
        language,
        customFields
      );
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /multiRAG/buildGraph
  async buildGraph(req, res) {
    try {
      const { docs, frameworkName } = req.body;
      const graphData = await graphService.buildGraphDataFromDocs(
        docs,
        frameworkName
      );
      res.json({ graphData });
    } catch (err) {
      console.error('Error building multi-RAG graph:', err);
      res.status(500).send(err.message);
    }
  },

  async multyRAGSummarize(req, res) {
    try {
      const { docs = [], language = 'en' } = req.body;

      // 调用 service
      const summaryResult = await multiRAGService.multiRAGSummarize(
        docs,
        language
      );

      // 返回
      return res.json(summaryResult);
    } catch (err) {
      console.error('Error in multyRAGSummarize:', err);
      res.status(500).send(err.message);
    }
  },
};
