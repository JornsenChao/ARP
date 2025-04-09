const workflowData = [
    {
      id: 1,
      status: 'current', // 第一个 Step 默认 current
      stepTitle: 'Define Scope',
      deliverable:
        'An agreed resilience scope with the client. (Hover to see more...)',
      deliverableDetail:
        'Specify resilience scope with the client, including case study, understanding of resilience, expected deliverables, hazards, assets, and stakeholders.',
      tasks: [
        {
          id: 101,
          title: 'Identify client expectation',
          detail:
            'Clarify the client’s understanding of resilience, examples, cost, etc.',
          status: 'current', // 第一个设为 current
          locked: false, // current => unlocked
          inputText: '', // 用户可输入的内容
        },
        {
          id: 102,
          title: 'Educate awareness through conversation',
          detail:
            'Discuss with the client about real-world resilience cases, adoption feasibility, and ROI.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 2,
      status: 'upcoming',
      stepTitle: 'Build Team',
      deliverable:
        'Resilient design workplan & coordination. (Hover to see more)',
      deliverableDetail:
        'Build a multi-disciplinary team, gather expertise from architecture, landscape, engineering, MEP, etc., confirm responsibilities, set up workshops and documentation procedures',
      tasks: [
        {
          id: 201,
          title: 'Assemble multi-disciplinary team',
          detail:
            'Gather expertise from architecture, landscape, engineering, MEP, etc.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 202,
          title: 'Project delivery alignment',
          detail:
            'Confirm responsibilities, set up workshops and documentation procedures.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 3,
      status: 'upcoming',
      stepTitle: 'Identify Who & What',
      deliverable:
        'Documentation: [hazard] -> [asset and stakeholder] mapping. (Hover to see more)',
      deliverableDetail: ' Specify hazards, assets, and stakeholders.',
      tasks: [
        {
          id: 301,
          title: 'Identify stakeholders',
          detail:
            'List primary and secondary stakeholders, their roles, and interests.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 302,
          title: 'Identify major hazards',
          detail:
            'Outline potential hazards like floods, earthquakes, storms, etc.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 303,
          title: 'Define assets & design standards',
          detail:
            'Clarify performance criteria, building codes, and resilience objectives.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 4,
      status: 'upcoming',
      stepTitle: 'Assess Vulnerability & Risk',
      deliverable:
        'Identified hazards & prioritized risk matrix for each stakeholder & asset. (Hover to see more)',
      deliverableDetail:
        'Evaluate vulnerability & risk, prioritize them, and consider future scenarios.  ',
      tasks: [
        {
          id: 401,
          title: 'Evaluate vulnerability',
          detail: 'Determine who/what is most susceptible to hazards.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 402,
          title: 'Analyze likelihood & consequence',
          detail: 'Assess hazard probability and potential impact severity.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 403,
          title: 'Risk prioritization',
          detail:
            'Use risk matrix (Exposure × Consequence × Likelihood) to rank hazards.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 5,
      status: 'upcoming',
      stepTitle: 'Develop Strategy',
      deliverable: 'Outlined design strategy repository. (Hover to see more)',
      deliverableDetail: 'Prepare a strategy library',
      tasks: [
        {
          id: 501,
          title: 'Define primary & secondary impact-asset pairs',
          detail:
            'Identify critical building performance aspects for each hazard.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 502,
          title: 'Incorporate design components',
          detail:
            'List potential structural and non-structural measures in a strategy library.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 6,
      status: 'upcoming',
      stepTitle: 'Evaluate & Select Strategy: CBA, BCA',
      deliverable:
        'Optimal strategy combination for the owner. (Hover to see more)',
      deliverableDetail:
        'Compare multiple strategies, based on cost-effectiveness. Select the best combination. ',
      tasks: [
        {
          id: 601,
          title: 'Benefit-Cost Analysis (BCA)',
          detail:
            'Quantify avoided damages vs. the cost of implementing protective strategies.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 602,
          title: 'Multi-criteria comparison (CBA)',
          detail:
            'Rank feasibility, sustainability, cost, ROI, etc. to select the best strategy.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
    {
      id: 7,
      status: 'upcoming',
      stepTitle: 'Evaluate After Construction',
      deliverable:
        'Refined insights & lessons learned for resilience performance. (Hover to see more)',
      deliverableDetail: 'POE',
      tasks: [
        {
          id: 701,
          title: 'Post Occupancy Evaluation',
          detail:
            'Collect feedback from building users; measure satisfaction and performance.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
        {
          id: 702,
          title: 'Data gathering & continuous improvement',
          detail:
            'Observe actual performance vs. predicted resilience outcomes for future updates.',
          status: 'upcoming',
          locked: true,
          inputText: '',
        },
      ],
    },
  ];
  
  export default workflowData;
  