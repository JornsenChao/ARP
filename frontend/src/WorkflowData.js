// src/WorkflowData.js

const workflowData = [
  {
    id: 1,
    stepTitle: 'Define Scope',
    tasks: [
      {
        id: 101,
        title: 'Identify client expectation & deliverables',
        detail:
          'Clarify the client’s understanding of resilience, the importance, examples, cost, return, etc.',
      },
      {
        id: 102,
        title: 'Educate awareness through conversation',
        detail:
          'Discuss with the client about real-world resilience cases, adoption feasibility, and ROI.',
      },
    ],
    deliverable: 'An agreed resilience scope with the client.',
  },
  {
    id: 2,
    stepTitle: 'Build Team',
    tasks: [
      {
        id: 201,
        title: 'Assemble multi-disciplinary team',
        detail:
          'Gather expertise from architecture, landscape, engineering, MEP, etc.',
      },
      {
        id: 202,
        title: 'Project delivery alignment',
        detail:
          'Confirm responsibilities, set up workshops and documentation procedures.',
      },
    ],
    deliverable: 'Resilient design workplan & coordination.',
  },
  {
    id: 3,
    stepTitle: 'Identify Who & What',
    tasks: [
      {
        id: 301,
        title: 'Identify stakeholders',
        detail:
          'List primary and secondary stakeholders, their roles, and interests.',
      },
      {
        id: 302,
        title: 'Identify major hazards',
        detail:
          'Outline potential hazards like floods, earthquakes, storms, etc.',
      },
      {
        id: 303,
        title: 'Define assets & design standards',
        detail:
          'Clarify performance criteria, building codes, and resilience objectives.',
      },
    ],
    deliverable: 'Documentation: [hazard] -> [asset and stakeholder] mapping.',
  },
  {
    id: 4,
    stepTitle: 'Assess Vulnerability & Risk',
    tasks: [
      {
        id: 401,
        title: 'Exposure to Hazards',
        detail: 'Yes/No + Rationale for each hazard.',
      },
      {
        id: 402,
        title: 'Evaluate Impact',
        detail:
          'Determine who/what is most susceptible to hazards. Assess consequences on various systems.',
      },
      {
        id: 403,
        title: 'Analyze likelihood & consequence',
        detail: 'Assess hazard probability and potential impact severity.',
      },
      {
        id: 404,
        title: 'Risk prioritization',
        detail:
          'Use risk matrix (Exposure × Consequence × Likelihood) to rank hazards.',
      },
      {
        id: 405,
        title: 'Consider stress vs. shock',
        detail: 'Include future scenarios and compounding/ cascading effects.',
      },
    ],
    deliverable:
      'Identified hazards & prioritized risk matrix for each stakeholder & asset.',
  },
  {
    id: 5,
    stepTitle: 'Develop Strategy',
    tasks: [
      {
        id: 501,
        title: 'Define primary & secondary impact-asset pairs',
        detail:
          'Identify critical building performance aspects for each hazard.',
      },
      {
        id: 502,
        title: 'Incorporate design components',
        detail:
          'List potential structural and non-structural measures in a strategy library.',
      },
    ],
    deliverable: 'Outlined design strategy repository.',
  },
  {
    id: 6,
    stepTitle: 'Evaluate & Select Strategy: CBA, BCA',
    tasks: [
      {
        id: 601,
        title: 'Benefit-Cost Analysis (BCA)',
        detail:
          'Quantify avoided damages vs. the cost of implementing protective strategies.',
      },
      {
        id: 602,
        title: 'Multi-criteria comparison (CBA)',
        detail:
          'Rank feasibility, sustainability, cost, ROI, etc. to select the best strategy.',
      },
    ],
    deliverable: 'Optimal strategy combination for the owner.',
  },
  {
    id: 7,
    stepTitle: 'Evaluate After Construction',
    tasks: [
      {
        id: 701,
        title: 'Post Occupancy Evaluation',
        detail:
          'Collect feedback from building users; measure satisfaction and performance.',
      },
      {
        id: 702,
        title: 'Data gathering & continuous improvement',
        detail:
          'Observe actual performance vs. predicted resilience outcomes for future updates.',
      },
    ],
    deliverable:
      'Refined insights & lessons learned for resilience performance.',
  },
];

export default workflowData;
