import express from 'express';
import { proRAGController } from '../controllers/proRAGController.js';

export const proRAGRoutes = express.Router();

// POST /proRAG/query
proRAGRoutes.post('/query', proRAGController.proRAGQuery);

// POST /proRAG/queryCoT
proRAGRoutes.post('/queryCoT', proRAGController.proRAGQueryCoT);

// POST /proRAG/buildGraph
proRAGRoutes.post('/buildGraph', proRAGController.buildGraph);
