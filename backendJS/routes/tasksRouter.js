// backendJS/routes/tasksRouter.js

import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
} from '../controllers/tasksController.js';

const router = Router();

// /tasks -> GET
router.get('/', getAllTasks);
// /tasks/:taskId -> GET
router.get('/:taskId', getTaskById);
// /tasks -> POST
router.post('/', createTask);

export default router;
