import { proRAGService } from '../services/proRAGService.js';
import { fileService } from '../services/fileService.js';
import { graphService } from '../services/graphService.js';

export const proRAGController = {
  // POST /proRAG/query
  async proRAGQuery(req, res) {
    try {
      const {
        fileKey,
        dependencyData,
        userQuery,
        language,
        customFields = [],
      } = req.body;
      const store = fileService.getMemoryStore(fileKey);
      if (!store) {
        return res.status(404).send('File not found or store not built');
      }
      const { answer, usedPrompt, docs } = await proRAGService.proRAGQuery(
        store,
        dependencyData,
        userQuery,
        language,
        customFields
      );
      res.json({ answer, usedPrompt, docs });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /proRAG/queryCoT
  async proRAGQueryCoT(req, res) {
    try {
      const {
        fileKey,
        dependencyData,
        userQuery,
        language,
        customFields = [],
      } = req.body;
      const store = fileService.getMemoryStore(fileKey);
      if (!store) {
        return res.status(404).send('File not found or store not built');
      }
      const { answer, usedPrompt } = await proRAGService.proRAGQueryCoT(
        store,
        dependencyData,
        userQuery,
        language,
        customFields
      );
      res.json({ answer, usedPrompt });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.message);
    }
  },

  // POST /proRAG/buildGraph
  async buildGraph(req, res) {
    try {
      const { docs, frameworkName } = req.body;
      const graphData = await graphService.buildGraphDataFromDocs(
        docs,
        frameworkName
      );
      res.json({ graphData });
    } catch (err) {
      console.error('Error building graph:', err);
      res.status(500).send(err.message);
    }
  },
};
