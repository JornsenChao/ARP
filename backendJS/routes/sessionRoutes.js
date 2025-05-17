// backendJS/routes/sessionRoutes.js
import express from 'express';
import { sessionController } from '../controllers/sessionController.js';

export const sessionRoutes = express.Router();

/**
 * DELETE /session?sessionId=xxx
 * Delete all data associated with a session
 */
sessionRoutes.delete('/', sessionController.deleteSession);
