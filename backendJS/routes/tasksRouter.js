// backendJS/routes/tasksRouter.js
const express = require('express');
const {
  getAllTasks,
  getTaskById,
  createTask,
} = require('../controllers/tasksController');

const router = express.Router();

// /tasks -> GET
router.get('/', getAllTasks);
// /tasks/:taskId -> GET
router.get('/:taskId', getTaskById);
// /tasks -> POST
router.post('/', createTask);

module.exports = router;
