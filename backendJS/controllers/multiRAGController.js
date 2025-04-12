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
      } = req.body;
      // 取出多个 memoryStore
      const stores = fileService.getStoresByKeys(fileKeys);
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
};
