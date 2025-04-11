// backendJS/routes/essentialWorkflowRouter.js

const express = require('express');
const {
  getWorkflowState,
  saveWorkflowState,
} = require('../controllers/essentialWorkflowController');

const router = express.Router();

// 获取指定项目的 Essential Workflow 状态
// GET /workflow/:projectId
router.get('/:projectId', (req, res) => {
  const { projectId } = req.params;
  const state = getWorkflowState(projectId);
  res.json(state);
});

// 保存或更新指定项目的 Essential Workflow 状态
// POST /workflow/:projectId
router.post('/:projectId', (req, res) => {
  const { projectId } = req.params;
  const newState = req.body; // 前端发送的完整 workflowState
  saveWorkflowState(projectId, newState);
  res.json({ message: 'Workflow state saved successfully', state: newState });
});

module.exports = router;
