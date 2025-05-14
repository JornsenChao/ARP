// backendJS/controllers/step2Controller.js
import {
  getWorkflowState,
  saveWorkflowState,
} from './essentialWorkflowController.js';
import { impactCategories } from '../mockData/impactCategories.js';
import { computeBayesianLikelihoodForHazards } from '../services/bayesModelService.js';

function ensureImpactCategoriesInState(req) {
  const state = getWorkflowState(req);
  if (!state.step2.impactCategories) {
    state.step2.impactCategories = JSON.parse(JSON.stringify(impactCategories));
    saveWorkflowState(req, state);
  }
}

// ============ API 1) 获取系统-子系统结构 ============
export function getImpactCategories(req, res) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res
        .status(400)
        .json({ detail: 'Missing required sessionId parameter' });
    }

    ensureImpactCategoriesInState(req);
    const state = getWorkflowState(req);
    if (!state || !state.step2 || !state.step2.impactCategories) {
      return res
        .status(404)
        .json({ detail: 'Impact categories not found for this session' });
    }

    return res.json({ impactCategories: state.step2.impactCategories });
  } catch (err) {
    console.error('Error in getImpactCategories:', err);
    return res
      .status(500)
      .json({ detail: 'Internal server error: ' + err.message });
  }
}

/**
 * 2) 新增一个顶层System
 */
export function addSystem(req, res) {
  const { systemName } = req.body;
  if (!systemName) {
    return res.status(400).json({ detail: 'systemName is required' });
  }
  ensureImpactCategoriesInState(req);
  const state = getWorkflowState(req);

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
  saveWorkflowState(req, state);

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
  ensureImpactCategoriesInState(req);
  const state = getWorkflowState(req);

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
  saveWorkflowState(req, state);

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

  const state = getWorkflowState(req);
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

  saveWorkflowState(req, state);
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

  const state = getWorkflowState(req);
  const list = state.step2.likelihoodData;

  const idx = list.findIndex((h) => h.hazard === hazard);
  if (idx >= 0) {
    list[idx].likelihoodRating = Number(likelihoodRating);
  } else {
    list.push({ hazard, likelihoodRating: Number(likelihoodRating) });
  }

  saveWorkflowState(req, state);
  res.json({ message: 'Likelihood rating saved', likelihoodData: list });
}

/**
 * 6) GET /workflow/step2/risk?sortBy=system|hazard|score
 */
export function calculateAndGetRisk(req, res) {
  const state = getWorkflowState(req);
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
  saveWorkflowState(req, state);

  res.json({ riskResult });
}

/**
 * 7) 标记step2完成
 */
export function markStep2Complete(req, res) {
  const state = getWorkflowState(req);
  state.step2.isCompleted = true;
  saveWorkflowState(req, state);

  res.json({ message: 'Step2 marked as completed', step2: state.step2 });
}

/**
 * 清空 Impact Data
 */
export function clearImpactData(req, res) {
  const state = getWorkflowState(req);
  state.step2.impactData = [];
  state.step2.selectedRisks = [];

  saveWorkflowState(req, state);
  res.json({
    message: 'Impact data cleared.',
    step2: state.step2,
  });
}

/**
 * 清空 Likelihood Data
 */
export function clearLikelihoodData(req, res) {
  const state = getWorkflowState(req);
  state.step2.likelihoodData = [];
  state.step2.selectedRisks = [];
  saveWorkflowState(req, state);
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

  const state = getWorkflowState(req);

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

  saveWorkflowState(req, state);
  return res.json({
    message: 'Selection updated',
    selectedRisks: state.step2.selectedRisks,
  });
}

/**
 * 新增:
 * GET /workflow/step2/model-likelihood
 *   - 读取 workflowState 中 step1.hazards, step1.femaRecords
 *   - 调用 bayesModelService 的 computeBayesianLikelihoodForHazards
 *   - 返回 { hazard, suggestedRating, horizonProb, ...}
 */
export function getBayesianModelLikelihood(req, res) {
  try {
    const { modelApproach, interpretation, sessionId } = req.query;
    if (!sessionId) {
      return res
        .status(400)
        .json({ detail: 'Missing required sessionId parameter' });
    }

    // default fallback
    const approach = modelApproach || 'quickGamma';
    const interpret = interpretation || 'prob30';
    const horizonYears = 30;

    const state = getWorkflowState(req);
    const hazards = state.step1?.hazards || [];
    const records = state.step1?.femaRecords || [];

    const result = computeBayesianLikelihoodForHazards({
      hazards,
      femaRecords: records,
      horizonYears,
      modelApproach: approach,
      interpretation: interpret,
    });

    res.json({
      modelApproach: approach,
      interpretation: interpret,
      data: result,
    });
  } catch (err) {
    console.error('getBayesianModelLikelihood error:', err);
    res.status(500).json({ error: err.message });
  }
}
