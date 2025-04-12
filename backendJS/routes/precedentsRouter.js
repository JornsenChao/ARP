// backendJS/routes/precedentsRouter.js

import { Router } from 'express';
import {
  getAllPrecedents,
  getPrecedentById,
} from '../controllers/precedentsController.js';

const router = Router();

// GET /precedents
router.get('/', getAllPrecedents);
// GET /precedents/:id
router.get('/:id', getPrecedentById);

export default router;
