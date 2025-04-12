// backendJS/routes/tasksRouter.js
// const express = require('express');
// const {
//   getAllTasks,
//   getTaskById,
//   createTask,
// } = require('../controllers/tasksController');

import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
} from '../controllers/tasksController.js';
// const router = express.Router();
const router = Router();

// /tasks -> GET
router.get('/', getAllTasks);
// /tasks/:taskId -> GET
router.get('/:taskId', getTaskById);
// /tasks -> POST
router.post('/', createTask);

// module.exports = router;
export default router;
