import express from 'express';
import { fileController } from '../controllers/fileController.js';

export const fileRoutes = express.Router();

// GET /files/list
fileRoutes.get('/list', fileController.listFiles);

// POST /files/upload
fileRoutes.post('/upload', fileController.uploadFile);

// PATCH /files/:fileKey
fileRoutes.patch('/:fileKey', fileController.updateFile);

// DELETE /files/:fileKey
fileRoutes.delete('/:fileKey', fileController.deleteFile);

// POST /files/:fileKey/mapColumns
fileRoutes.post('/:fileKey/mapColumns', fileController.mapColumns);

// GET /files/:fileKey/columns
fileRoutes.get('/:fileKey/columns', fileController.getColumns);

// POST /files/:fileKey/buildStore
fileRoutes.post('/:fileKey/buildStore', fileController.buildStore);

// GET /files/loadDemo
fileRoutes.get('/loadDemo', fileController.loadDemo);
