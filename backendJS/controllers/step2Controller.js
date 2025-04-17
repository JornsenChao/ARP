// backendJS/controllers/step2Controller.js
import {
  getWorkflowState,
  saveWorkflowState,
} from './essentialWorkflowController.js';
import { impactCategories } from '../mockData/impactCategories.js';

function ensureImpactCategoriesInState() {
  const state = getWorkflowState();
  if (!state.step2.impactCategories) {
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
 */
export function addSystem(req, res) {
  const { systemName } = req.body;
  if (!systemName) {
    return res.status(400).json({ detail: 'systemName is required' });
  }
  ensureImpactCategoriesInState();
  const state = getWorkflowState();

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
 */
export function calculateAndGetRisk(req, res) {
  const state = getWorkflowState();
  const { impactData, likelihoodData } = state.step2;
  const { sortBy } = req.query;

  const lhMap = {};
  likelihoodData.forEach((item) => {
    lhMap[item.hazard] = item.likelihoodRating;
  });

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

  if (sortBy === 'system') {
    riskResult.sort((a, b) => {
      const sysCmp = a.systemName.localeCompare(b.systemName);
      if (sysCmp !== 0) return sysCmp;
      const subCmp = a.subSystemName.localeCompare(b.subSystemName);
      if (subCmp !== 0) return subCmp;
      return a.hazard.localeCompare(b.hazard);
    });
  } else if (sortBy === 'hazard') {
    riskResult.sort((a, b) => {
      const hzCmp = a.hazard.localeCompare(b.hazard);
      if (hzCmp !== 0) return hzCmp;
      const sysCmp = a.systemName.localeCompare(b.systemName);
      if (sysCmp !== 0) return sysCmp;
      return a.subSystemName.localeCompare(b.subSystemName);
    });
  } else if (sortBy === 'score') {
    riskResult.sort((a, b) => b.riskScore - a.riskScore);
  }

  state.step2.riskResult = riskResult;
  saveWorkflowState(state);

  res.json({ riskResult });
}

/**
 * 7) 标记step2完成
 */
export function markStep2Complete(req, res) {
  const state = getWorkflowState();
  state.step2.isCompleted = true;
  saveWorkflowState(state);

  res.json({ message: 'Step2 marked as completed', step2: state.step2 });
}

/**
 * 清空 Impact Data
 */
export function clearImpactData(req, res) {
  const state = getWorkflowState();
  state.step2.impactData = [];
  state.step2.selectedRisks = [];

  saveWorkflowState(state);
  res.json({
    message: 'Impact data cleared.',
    step2: state.step2,
  });
}

/**
 * 清空 Likelihood Data
 */
export function clearLikelihoodData(req, res) {
  const state = getWorkflowState();
  state.step2.likelihoodData = [];
  state.step2.selectedRisks = [];
  saveWorkflowState(state);
  res.json({
    message: 'Likelihood data cleared.',
    step2: state.step2,
  });
}

/**
 *  8) 选中/取消选中 risk：只存 "reference key"
 *  Body: { hazard, systemName, subSystemName, selected: boolean }
 */
export function setSelectedRisk(req, res) {
  const { hazard, systemName, subSystemName, selected } = req.body;
  if (
    !hazard ||
    !systemName ||
    !subSystemName ||
    typeof selected !== 'boolean'
  ) {
    return res.status(400).json({
      detail:
        'hazard, systemName, subSystemName, and "selected" (bool) are required',
    });
  }

  const state = getWorkflowState();

  if (selected) {
    // 若没有则加入
    const exist = state.step2.selectedRisks.find(
      (r) =>
        r.hazard === hazard &&
        r.systemName === systemName &&
        r.subSystemName === subSystemName
    );
    if (!exist) {
      state.step2.selectedRisks.push({ hazard, systemName, subSystemName });
    }
  } else {
    // 取消勾选则移除
    state.step2.selectedRisks = state.step2.selectedRisks.filter(
      (r) =>
        !(
          r.hazard === hazard &&
          r.systemName === systemName &&
          r.subSystemName === subSystemName
        )
    );
  }

  saveWorkflowState(state);
  return res.json({
    message: 'Selection updated',
    selectedRisks: state.step2.selectedRisks,
  });
}
