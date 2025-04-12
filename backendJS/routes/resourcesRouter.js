// backendJS/routes/resourcesRouter.js

import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
} from '../controllers/resourcesController.js';
const router = Router();

// GET /resources
router.get('/', getAllResources);
// GET /resources/:id
router.get('/:id', getResourceById);

export default router;
