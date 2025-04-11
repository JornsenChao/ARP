// backendJS/routes/essentialWorkflowRouter.js
const express = require('express');
const {
  getWorkflowState,
  saveWorkflowState,
} = require('../controllers/essentialWorkflowController');
const { getFemaHazards } = require('../controllers/femaController');

const router = express.Router();

// 获取当前单一的 Essential Workflow 状态
// GET /workflow
router.get('/', (req, res) => {
  const state = getWorkflowState();
  res.json(state);
});

// 保存或更新当前的 Essential Workflow 状态
// POST /workflow
router.post('/', (req, res) => {
  const newState = req.body; // 前端发送的完整 workflowState
  saveWorkflowState(newState);
  res.json({ message: 'Workflow state saved successfully', state: newState });
});

// 调用FEMA API，根据前端传入的 location 获取 hazards
// GET /workflow/hazards?location=Seattle,WA
router.get('/hazards', getFemaHazards);

module.exports = router;
