// backendJS/controllers/tasksController.js

import { tasksData } from '../data/tasksData.js';
// GET /tasks
export const getAllTasks = (req, res) => {
  const { query } = req.query;

  // 如果携带了query参数，则只返回匹配到的title
  if (query) {
    const filtered = tasksData.filter((task) =>
      task.title.toLowerCase().includes(query.toLowerCase())
    );
    return res.json(filtered);
  }

  // 否则返回所有
  res.json(tasksData);
};

// GET /tasks/:taskId
export const getTaskById = (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  const task = tasksData.find((t) => t.id === taskId);

  if (!task) {
    return res.status(404).json({ detail: 'Task not found' });
  }
  res.json(task);
};

// POST /tasks
export const createTask = (req, res) => {
  const { title, description } = req.body;
  const newId = tasksData.length
    ? Math.max(...tasksData.map((t) => t.id)) + 1
    : 1;

  const newTask = { id: newId, title, description };
  tasksData.push(newTask);

  res.status(201).json(newTask);
};
