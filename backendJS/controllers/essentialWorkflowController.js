// backendJS/controllers/essentialWorkflowController.js

// 全局内存存储，键为 projectId，值为整个 Essential Workflow 的 state 对象
const inMemoryStore = {};

/**
 * 获取指定项目的工作流状态
 */
function getWorkflowState(projectId) {
  // 如果没有对应条目，则返回一个默认空结构
  if (!inMemoryStore[projectId]) {
    // 这个“默认空结构”您可根据实际情况定义
    inMemoryStore[projectId] = {
      step1: {
        hazards: [], // 由FEMA API获取并用户选择
        isCompleted: false,
      },
      step2: {
        exposureData: {}, // 供子步骤1(Exposure)
        impactData: {}, // 供子步骤2(Impact)
        riskData: {}, // 供子步骤3(Risk)
        isCompleted: false,
        // 也可细分: isExposureDone, isImpactDone, isRiskDone
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
      // 其他需要的字段...
    };
  }
  return inMemoryStore[projectId];
}

/**
 * 保存指定项目的工作流状态
 */
function saveWorkflowState(projectId, newState) {
  inMemoryStore[projectId] = newState;
  // 如果需要写入本地文件，可以在这里fs.writeFileSync(...)
}

module.exports = {
  getWorkflowState,
  saveWorkflowState,
};
