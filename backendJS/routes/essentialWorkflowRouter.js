// backendJS/routes/essentialWorkflowRouter.js

const express = require('express');
const {
  getWorkflowState,
  saveWorkflowState,
} = require('../controllers/essentialWorkflowController');
const { getFemaHazards } = require('../controllers/femaController');

const router = express.Router();

// 读取/写入 workflow 状态
router.get('/', (req, res) => {
  const state = getWorkflowState();
  res.json(state);
});

router.post('/', (req, res) => {
  const newState = req.body;
  saveWorkflowState(newState);
  res.json({ message: 'Workflow state saved', state: newState });
});

// 调用FEMA接口
// GET /workflow/hazards?mode=xxx&location=xxx
router.get('/hazards', getFemaHazards);

module.exports = router;
