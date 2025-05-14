// backendJS/controllers/essentialWorkflowController.js

// 一个全局对象，存放单一的 Essential Workflow 状态
const workflowMap = {};
// 另外，可以定义一个函数: getOrCreateWorkflow(sessionId)
function getOrCreateWorkflow(sessionId) {
  if (!workflowMap[sessionId]) {
    // 如果该 sessionId 首次访问 => 创建一份“默认结构”
    workflowMap[sessionId] = {
      step1: {
        hazards: [],
        femaRecords: [], // 新增：存放 fetchFemaData 后的全部记录
        isCompleted: false,
      },
      step2: {
        // 下面是我们在此示例中使用的字段
        baselineCategories: [
          'Architectural Systems',
          'Structural Systems',
          'Mechanical/Electrical/Plumbing (MEP)',
          'Landscape',
          'Civil Infrastructure',
        ],
        userCategories: [],
        impactData: [],
        likelihoodData: [],
        riskResult: [],
        // 新增字段：用户在 Step2 第三子步骤里勾选的优先风险
        selectedRisks: [],
        isCompleted: false,
      },
      step3: {
        taskA: {
          data: [],
          summary: {
            globalSummary: '',
            globalSources: [],
            fileSummaryMap: [],
            graph: null, // 若需要保存图的节点/边结构
            graphLibrary: '', // 若需要保存用户选择的可视化方式
          },
          isCompleted: false,
        },
        taskB: {
          data: [],
          summary: {
            globalSummary: '',
            globalSources: [],
            fileSummaryMap: [],
            graph: null, // 若需要保存图的节点/边结构
            graphLibrary: '', // 若需要保存用户选择的可视化方式
          },
          isCompleted: false,
        },
        taskC: {
          data: [],
          summary: {
            globalSummary: '',
            globalSources: [],
            fileSummaryMap: [],
            graph: null, // 若需要保存图的节点/边结构
            graphLibrary: '', // 若需要保存用户选择的可视化方式
          },
          isCompleted: false,
        },
        context: {}, // 用于存dependencyData
        collection: [], // 用于存用户添加的collection
      },
      step4: {
        collectionData: {},
        isCompleted: false,
      },
    };
  }
  return workflowMap[sessionId];
}

export function getWorkflowState(req) {
  const { sessionId } = req.query;
  if (!sessionId) {
    throw new Error('Missing ?sessionId=xxx in the request');
  }
  return getOrCreateWorkflow(sessionId);
}

export function saveWorkflowState(req, newState) {
  const { sessionId } = req.query;
  if (!sessionId) {
    throw new Error('Missing ?sessionId=xxx in the request');
  }
  workflowMap[sessionId] = newState; // 直接覆盖
}
