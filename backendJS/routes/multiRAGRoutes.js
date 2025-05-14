import express from 'express';
import { multiRAGController } from '../controllers/multiRAGController.js';

export const multiRAGRoutes = express.Router();

// POST /multiRAG/query
multiRAGRoutes.post('/query', multiRAGController.multiRAGQuery);

// POST /multiRAG/queryCoT
multiRAGRoutes.post('/queryCoT', multiRAGController.multiRAGQueryCoT);

// POST /multiRAG/buildGraph
multiRAGRoutes.post('/buildGraph', multiRAGController.buildGraph);

// POST /multiRAG/summarize
multiRAGRoutes.post('/summarize', multiRAGController.multiRAGSummarize);
