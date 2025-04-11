// backendJS/controllers/essentialWorkflowController.js

// 一个全局对象，存放单一的 Essential Workflow 状态
let workflowState = {
  step1: {
    hazards: [],
    isCompleted: false,
  },
  step2: {
    exposureData: {},
    impactData: {},
    riskData: {},
    isCompleted: false,
  },
  step3: {
    taskA: { data: [], isCompleted: false },
    taskB: { data: [], isCompleted: false },
    taskC: { data: [], isCompleted: false },
  },
  step4: {
    summaryData: {},
    isCompleted: false,
  },
};

/**
 * 获取工作流状态
 */
function getWorkflowState() {
  return workflowState;
}

/**
 * 保存工作流状态（完整替换）
 */
function saveWorkflowState(newState) {
  workflowState = newState;
}

module.exports = {
  getWorkflowState,
  saveWorkflowState,
};
