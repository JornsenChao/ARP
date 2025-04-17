// backendJS/routes/essentialWorkflowRouter.js

import { Router } from 'express';
import {
  getWorkflowState,
  saveWorkflowState,
} from '../controllers/essentialWorkflowController.js';
import { getFemaHazards } from '../controllers/femaController.js';
// Step2 相关
import {
  getImpactCategories,
  addSystem,
  addSubSystem,
  setImpactRating,
  setLikelihoodRating,
  calculateAndGetRisk,
  markStep2Complete,
  clearImpactData,
  clearLikelihoodData,
  setSelectedRisk,
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
// [*] 新增: 获取系统-子系统 baseline
router.get('/step2/impact-categories', getImpactCategories);

// [*] 新增: 添加系统 / 添加子系统
router.post('/step2/add-system', addSystem);
router.post('/step2/add-subsystem', addSubSystem);

// 影响/可能性打分
router.post('/step2/impact', setImpactRating);
router.post('/step2/likelihood', setLikelihoodRating);

// 计算risk
router.get('/step2/risk', calculateAndGetRisk);

router.post('/step2/clear-impact', clearImpactData);
router.post('/step2/clear-likelihood', clearLikelihoodData);
router.post('/step2/select-risk', setSelectedRisk);
// 标记完成
router.post('/step2/complete', markStep2Complete);

export default router;
