// backendJS/controllers/step2Controller.js
// const {
//   getWorkflowState,
//   saveWorkflowState,
// } = require('./essentialWorkflowController');
import {
  getWorkflowState,
  saveWorkflowState,
} from './essentialWorkflowController.js';
/**
 * GET /workflow/step2/categories
 * 返回 baselineCategories + userCategories 的合并
 */
export function getStep2Categories(req, res) {
  const state = getWorkflowState();
  const { baselineCategories, userCategories } = state.step2;

  const merged = [...baselineCategories, ...userCategories];
  res.json({ categories: merged });
}

/**
 * POST /workflow/step2/categories
 * Body: { categoryName: string }
 * 在 userCategories 中新增用户自定义系统分类
 */
export function addStep2Category(req, res) {
  const { categoryName } = req.body;
  if (!categoryName) {
    return res.status(400).json({ detail: 'categoryName is required' });
  }

  const state = getWorkflowState();
  // 将新分类插入 userCategories
  if (!state.step2.userCategories.includes(categoryName)) {
    state.step2.userCategories.push(categoryName);
  }

  saveWorkflowState(state);
  res.json({ message: 'Category added', step2: state.step2 });
}

/**
 * POST /workflow/step2/impact
 * Body: { hazard, system, impactRating }
 * 将( hazard-system )的 impactRating 存到 step2.impactData
 * 如果已经存在就更新
 */
export function setImpactRating(req, res) {
  const { hazard, system, impactRating } = req.body;
  if (!hazard || !system || !impactRating) {
    return res
      .status(400)
      .json({ detail: 'hazard, system, and impactRating are required' });
  }

  const state = getWorkflowState();
  const impactData = state.step2.impactData;

  // 找是否已有此 hazard-system 记录
  const idx = impactData.findIndex(
    (item) => item.hazard === hazard && item.system === system
  );
  if (idx >= 0) {
    impactData[idx].impactRating = impactRating;
  } else {
    impactData.push({ hazard, system, impactRating });
  }

  saveWorkflowState(state);
  res.json({ message: 'Impact rating saved', impactData });
}

/**
 * POST /workflow/step2/likelihood
 * Body: { hazard, likelihoodRating }
 * 将 hazard 的 likelihoodRating 存到 step2.likelihoodData
 * 如果已经存在就更新
 */
export function setLikelihoodRating(req, res) {
  const { hazard, likelihoodRating } = req.body;
  if (!hazard || likelihoodRating == null) {
    return res
      .status(400)
      .json({ detail: 'hazard and likelihoodRating are required' });
  }

  const state = getWorkflowState();
  const list = state.step2.likelihoodData;

  const idx = list.findIndex((h) => h.hazard === hazard);
  if (idx >= 0) {
    list[idx].likelihoodRating = likelihoodRating;
  } else {
    list.push({ hazard, likelihoodRating });
  }

  saveWorkflowState(state);
  res.json({ message: 'Likelihood rating saved', likelihoodData: list });
}

/**
 * GET /workflow/step2/risk
 * 返回根据 impactData × likelihoodData 计算出的 riskResult
 * riskScore = impactRating × likelihoodRating
 * 并把结果也存入 state.step2.riskResult
 */
export function calculateAndGetRisk(req, res) {
  const state = getWorkflowState();
  const { impactData, likelihoodData } = state.step2;

  // 构建一个 map: hazard => likelihoodRating
  const lhMap = {};
  likelihoodData.forEach((item) => {
    lhMap[item.hazard] = item.likelihoodRating;
  });

  // 遍历 impactData, 计算 risk
  const riskResult = impactData.map((imp) => {
    const hazard = imp.hazard;
    const system = imp.system;
    const impact = imp.impactRating;
    const likelihood = lhMap[hazard] || 0;
    const riskScore = impact * likelihood;

    return {
      hazard,
      system,
      impactRating: impact,
      likelihoodRating: likelihood,
      riskScore,
    };
  });

  // 排序：风险分数高的排前
  riskResult.sort((a, b) => b.riskScore - a.riskScore);

  // 存入 state
  state.step2.riskResult = riskResult;
  saveWorkflowState(state);

  res.json({ riskResult });
}

/**
 * POST /workflow/step2/complete
 * 标记 step2.isCompleted = true
 */
export function markStep2Complete(req, res) {
  const state = getWorkflowState();
  state.step2.isCompleted = true;
  saveWorkflowState(state);

  res.json({ message: 'Step2 marked as completed', step2: state.step2 });
}

// module.exports = {
//   getStep2Categories,
//   addStep2Category,
//   setImpactRating,
//   setLikelihoodRating,
//   calculateAndGetRisk,
//   markStep2Complete,
// };
