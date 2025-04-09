// src/pages/Workflow.js
import React, { useState } from 'react';
import workflowData from '../WorkflowData';
import { Box } from '@mui/material';
import './Workflow.css';

const Workflow = () => {
  // 用于追踪当前选中（或展开）的任务ID
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const toggleTaskDetail = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null); // 如果重复点击同一个任务，则收起
    } else {
      setExpandedTaskId(taskId);
    }
  };

  return (
    <div className="workflow-container">
      <h1>Resilience Design & Evaluation Workflow</h1>
      {workflowData.map((step) => (
        <div key={step.id} className="workflow-step">
          <h2>
            {step.id}. {step.stepTitle}
          </h2>

          <ul className="task-list">
            {step.tasks.map((task) => (
              <li key={task.id} className="task-item">
                <div
                  className="task-title"
                  onClick={() => toggleTaskDetail(task.id)}
                >
                  {task.title}
                </div>
                {expandedTaskId === task.id && (
                  <div className="task-detail">
                    <p>{task.detail}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="deliverable">
            <strong>Deliverable:</strong> {step.deliverable}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Workflow;
