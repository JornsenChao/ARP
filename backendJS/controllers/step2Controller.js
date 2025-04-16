// backendJS/controllers/step2Controller.js

import {
  getWorkflowState,
  saveWorkflowState,
} from './essentialWorkflowController.js';
import { impactCategories } from '../mockData/impactCategories.js';

/**
 * GET /workflow/step2/categories
 * 返回 baselineCategories + userCategories 的合并
 */
// export function getStep2Categories(req, res) {
//   const state = getWorkflowState();
//   const { baselineCategories, userCategories } = state.step2;

//   const merged = [...baselineCategories, ...userCategories];
//   res.json({ categories: merged });
// }

/**
 * POST /workflow/step2/categories
 * Body: { categoryName: string }
 * 在 userCategories 中新增用户自定义系统分类
 */
// export function addStep2Category(req, res) {
//   const { categoryName } = req.body;
//   if (!categoryName) {
//     return res.status(400).json({ detail: 'categoryName is required' });
//   }

//   const state = getWorkflowState();
//   // 将新分类插入 userCategories
//   if (!state.step2.userCategories.includes(categoryName)) {
//     state.step2.userCategories.push(categoryName);
//   }

//   saveWorkflowState(state);
//   res.json({ message: 'Category added', step2: state.step2 });
// }

/**
 * 初始化 impactCategories 到 workflowState.step2.impactCategories
 * 如果尚未设置
 */
function ensureImpactCategoriesInState() {
  const state = getWorkflowState();
  if (!state.step2.impactCategories) {
    // 从 mockData 载入默认模板
    state.step2.impactCategories = JSON.parse(JSON.stringify(impactCategories));
    saveWorkflowState(state);
  }
}

// ============ API 1) 获取系统-子系统结构 ============
export function getImpactCategories(req, res) {
  ensureImpactCategoriesInState();
  const state = getWorkflowState();
  return res.json({ impactCategories: state.step2.impactCategories });
}

/**
 * 2) 新增一个顶层System
 * body: { systemName }
 */
export function addSystem(req, res) {
  const { systemName } = req.body;
  if (!systemName) {
    return res.status(400).json({ detail: 'systemName is required' });
  }
  ensureImpactCategoriesInState();
  const state = getWorkflowState();

  // 如果已存在同名system则跳过或返回提示
  const exists = state.step2.impactCategories.find(
    (s) => s.systemName.toLowerCase() === systemName.toLowerCase()
  );
  if (exists) {
    return res
      .status(409)
      .json({ detail: `System '${systemName}' already exists.` });
  }

  state.step2.impactCategories.push({
    systemName,
    subSystems: [],
  });
  saveWorkflowState(state);

  return res.json({
    message: 'System added',
    impactCategories: state.step2.impactCategories,
  });
}

/**
 * 3) 在某个 system 下新增子系统
 * body: { systemName, subSystemName }
 */
export function addSubSystem(req, res) {
  const { systemName, subSystemName } = req.body;
  if (!systemName || !subSystemName) {
    return res
      .status(400)
      .json({ detail: 'systemName and subSystemName are required' });
  }
  ensureImpactCategoriesInState();
  const state = getWorkflowState();

  const sys = state.step2.impactCategories.find(
    (s) => s.systemName === systemName
  );
  if (!sys) {
    return res
      .status(404)
      .json({ detail: `System '${systemName}' not found in impactCategories` });
  }
  // 检查子系统重名
  const subExists = sys.subSystems.find(
    (sub) => sub.name.toLowerCase() === subSystemName.toLowerCase()
  );
  if (subExists) {
    return res
      .status(409)
      .json({ detail: `SubSystem '${subSystemName}' already exists.` });
  }

  sys.subSystems.push({ name: subSystemName });
  saveWorkflowState(state);

  return res.json({
    message: 'SubSystem added',
    impactCategories: state.step2.impactCategories,
  });
}
/**
 * 4) POST /workflow/step2/impact
 * Body: { hazard, systemName, subSystemName, impactRating }
 * 将( hazard-systemName-subSystemName )的 impactRating 存到 step2.impactData
 * 如果已经存在就更新
 */
export function setImpactRating(req, res) {
  const { hazard, systemName, subSystemName, impactRating } = req.body;
  if (!hazard || !systemName || !subSystemName || impactRating == null) {
    return res.status(400).json({
      detail:
        'hazard, systemName, subSystemName, and impactRating are required',
    });
  }

  const state = getWorkflowState();
  const impactData = state.step2.impactData;

  // 找是否已有此 hazard-system-subSystem 记录
  const idx = impactData.findIndex(
    (item) =>
      item.hazard === hazard &&
      item.systemName === systemName &&
      item.subSystemName === subSystemName
  );
  if (idx >= 0) {
    impactData[idx].impactRating = Number(impactRating);
  } else {
    impactData.push({
      hazard,
      systemName,
      subSystemName,
      impactRating: Number(impactRating),
    });
  }

  saveWorkflowState(state);
  res.json({ message: 'Impact rating saved', impactData });
}

/**
 * 5) POST /workflow/step2/likelihood
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
    list[idx].likelihoodRating = Number(likelihoodRating);
  } else {
    list.push({ hazard, likelihoodRating: Number(likelihoodRating) });
  }

  saveWorkflowState(state);
  res.json({ message: 'Likelihood rating saved', likelihoodData: list });
}

/**
 * 6) GET /workflow/step2/risk?sortBy=system|hazard|score
 * 返回根据 impactData × likelihoodData 计算出的 riskResult
 * riskScore = impactRating × likelihoodRating
 * 并把结果也存入 state.step2.riskResult
 * 另外可对结果进行排序
 */
export function calculateAndGetRisk(req, res) {
  const state = getWorkflowState();
  const { impactData, likelihoodData } = state.step2;
  const { sortBy } = req.query;

  // 构建一个 map: hazard => likelihoodRating
  const lhMap = {};
  likelihoodData.forEach((item) => {
    lhMap[item.hazard] = item.likelihoodRating;
  });

  // 遍历 impactData, 计算 risk
  const riskResult = impactData.map((imp) => {
    const hazard = imp.hazard;
    const systemName = imp.systemName;
    const subSystemName = imp.subSystemName;
    const impact = imp.impactRating;
    const likelihood = lhMap[hazard] || 0;
    const riskScore = impact * likelihood;

    return {
      hazard,
      systemName,
      subSystemName,
      impactRating: impact,
      likelihoodRating: likelihood,
      riskScore,
    };
  });

  // 排序逻辑
  if (sortBy === 'system') {
    // 按 systemName -> subSystemName -> hazard
    riskResult.sort((a, b) => {
      const sysCmp = a.systemName.localeCompare(b.systemName);
      if (sysCmp !== 0) return sysCmp;
      const subCmp = a.subSystemName.localeCompare(b.subSystemName);
      if (subCmp !== 0) return subCmp;
      return a.hazard.localeCompare(b.hazard);
    });
  } else if (sortBy === 'hazard') {
    // 按 hazard -> systemName -> subSystemName
    riskResult.sort((a, b) => {
      const hzCmp = a.hazard.localeCompare(b.hazard);
      if (hzCmp !== 0) return hzCmp;
      const sysCmp = a.systemName.localeCompare(b.systemName);
      if (sysCmp !== 0) return sysCmp;
      return a.subSystemName.localeCompare(b.subSystemName);
    });
  } else if (sortBy === 'score') {
    // 风险分高到低 or低到高, 看你需求，这里演示高到低
    riskResult.sort((a, b) => b.riskScore - a.riskScore);
  } else {
    // 如果没传或其他值，保留原顺序 or 你可以自定义默认
    // 这里暂留不排序
  }

  // 存入 state
  state.step2.riskResult = riskResult;
  saveWorkflowState(state);

  res.json({ riskResult });
}

/**
 * 7) POST /workflow/step2/complete
 * 标记 step2.isCompleted = true
 */
export function markStep2Complete(req, res) {
  const state = getWorkflowState();
  state.step2.isCompleted = true;
  saveWorkflowState(state);

  res.json({ message: 'Step2 marked as completed', step2: state.step2 });
}

// ========== (新增) 清空 Impact Data ==========
export function clearImpactData(req, res) {
  const state = getWorkflowState();
  // 把 step2.impactData 清空
  state.step2.impactData = [];
  // 同时也清空 impactCategories 里并不影响结构，但“已保存的打分记录”变为空
  // 不过一般不需要动 step2.impactCategories，因为那是system+subsystem的结构而不是打分
  saveWorkflowState(state);
  res.json({
    message: 'Impact data cleared.',
    step2: state.step2,
  });
}

// ========== (新增) 清空 Likelihood Data ==========
export function clearLikelihoodData(req, res) {
  const state = getWorkflowState();
  state.step2.likelihoodData = [];
  saveWorkflowState(state);
  res.json({
    message: 'Likelihood data cleared.',
    step2: state.step2,
  });
}
