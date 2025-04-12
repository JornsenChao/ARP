// backendJS/routes/essentialWorkflowRouter.js

import { Router } from 'express';
import {
  getWorkflowState,
  saveWorkflowState,
} from '../controllers/essentialWorkflowController.js';
import { getFemaHazards } from '../controllers/femaController.js';
// Step2 相关
import {
  getStep2Categories,
  addStep2Category,
  setImpactRating,
  setLikelihoodRating,
  calculateAndGetRisk,
  markStep2Complete,
} from '../controllers/step2Controller.js';

const router = Router();

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

// ========== (B) Step2 相关 API =============
router.get('/step2/categories', getStep2Categories);
router.post('/step2/categories', addStep2Category);

router.post('/step2/impact', setImpactRating);
router.post('/step2/likelihood', setLikelihoodRating);

router.get('/step2/risk', calculateAndGetRisk);

router.post('/step2/complete', markStep2Complete);

export default router;
