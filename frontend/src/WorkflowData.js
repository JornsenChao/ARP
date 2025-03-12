// src/WorkflowData.js

const workflowData = [
  {
    id: 1,
    stepTitle: 'Define Scope',
    deliverable:
      'An agreed resilience scope with the client. (Hover to see more...)',
    deliverableDetail:
      '在本步骤与客户沟通，明确对韧性的理解、重要性、参考案例、成本与回报等，并最终确定项目韧性目标范围。',
    tasks: [
      {
        id: 101,
        title: 'Identify client expectation & deliverables',
        detail:
          'Clarify the client’s understanding of resilience, the importance, examples, cost, return, etc.',
        status: 'current', // 第一个任务设为 current
      },
      {
        id: 102,
        title: 'Educate awareness through conversation',
        detail:
          'Discuss with the client about real-world resilience cases, adoption feasibility, and ROI.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 2,
    stepTitle: 'Build Team',
    deliverable:
      'Resilient design workplan & coordination. (Hover to see more)',
    deliverableDetail:
      '组建多学科团队，引入必要的专家顾问，明确角色与责任，形成初步协调方案。',
    tasks: [
      {
        id: 201,
        title: 'Assemble multi-disciplinary team',
        detail:
          'Gather expertise from architecture, landscape, engineering, MEP, etc.',
        status: 'upcoming',
      },
      {
        id: 202,
        title: 'Project delivery alignment',
        detail:
          'Confirm responsibilities, set up workshops and documentation procedures.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 3,
    stepTitle: 'Identify Who & What',
    deliverable:
      'Documentation: [hazard] -> [asset and stakeholder] mapping. (Hover to see more)',
    deliverableDetail: '确定主要利益相关方和资产，并列举潜在危险类型。',
    tasks: [
      {
        id: 301,
        title: 'Identify stakeholders',
        detail:
          'List primary and secondary stakeholders, their roles, and interests.',
        status: 'upcoming',
      },
      {
        id: 302,
        title: 'Identify major hazards',
        detail:
          'Outline potential hazards like floods, earthquakes, storms, etc.',
        status: 'upcoming',
      },
      {
        id: 303,
        title: 'Define assets & design standards',
        detail:
          'Clarify performance criteria, building codes, and resilience objectives.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 4,
    stepTitle: 'Assess Vulnerability & Risk',
    deliverable:
      'Identified hazards & prioritized risk matrix for each stakeholder & asset. (Hover to see more)',
    deliverableDetail: '评估脆弱性与风险优先级，考虑可叠加的未来情景。',
    tasks: [
      {
        id: 401,
        title: 'Evaluate vulnerability',
        detail: 'Determine who/what is most susceptible to hazards.',
        status: 'upcoming',
      },
      {
        id: 402,
        title: 'Analyze likelihood & consequence',
        detail: 'Assess hazard probability and potential impact severity.',
        status: 'upcoming',
      },
      {
        id: 403,
        title: 'Risk prioritization',
        detail:
          'Use risk matrix (Exposure × Consequence × Likelihood) to rank hazards.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 5,
    stepTitle: 'Develop Strategy',
    deliverable: 'Outlined design strategy repository. (Hover to see more)',
    deliverableDetail:
      '针对优先风险提出可能的结构与非结构性策略，并归纳到策略库。',
    tasks: [
      {
        id: 501,
        title: 'Define primary & secondary impact-asset pairs',
        detail:
          'Identify critical building performance aspects for each hazard.',
        status: 'upcoming',
      },
      {
        id: 502,
        title: 'Incorporate design components',
        detail:
          'List potential structural and non-structural measures in a strategy library.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 6,
    stepTitle: 'Evaluate & Select Strategy: CBA, BCA',
    deliverable:
      'Optimal strategy combination for the owner. (Hover to see more)',
    deliverableDetail: '对比多种韧性方案的成本与收益，筛选最优组合。',
    tasks: [
      {
        id: 601,
        title: 'Benefit-Cost Analysis (BCA)',
        detail:
          'Quantify avoided damages vs. the cost of implementing protective strategies.',
        status: 'upcoming',
      },
      {
        id: 602,
        title: 'Multi-criteria comparison (CBA)',
        detail:
          'Rank feasibility, sustainability, cost, ROI, etc. to select the best strategy.',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 7,
    stepTitle: 'Evaluate After Construction',
    deliverable:
      'Refined insights & lessons learned for resilience performance. (Hover to see more)',
    deliverableDetail: '对建成项目进行入住后评估，收集数据与反馈，并持续改进。',
    tasks: [
      {
        id: 701,
        title: 'Post Occupancy Evaluation',
        detail:
          'Collect feedback from building users; measure satisfaction and performance.',
        status: 'upcoming',
      },
      {
        id: 702,
        title: 'Data gathering & continuous improvement',
        detail:
          'Observe actual performance vs. predicted resilience outcomes for future updates.',
        status: 'upcoming',
      },
    ],
  },
];

export default workflowData;
