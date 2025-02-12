// src/pages/WorkflowHome.js

import React from 'react';
import { Link } from 'react-router-dom';
import workflowData from '../WorkflowData';
import './WorkflowHome.css';

const WorkflowHome = () => {
  return (
    <div className="workflow-home-container">
      <h1>Workflow Overview</h1>
      <div className="workflow-scroller">
        <div className="workflow-steps-line" />
        {workflowData.map((step) => (
          <div key={step.id} className="step-card">
            <Link to={`/workflow/step/${step.id}`} className="step-card-link">
              <h2>{step.stepTitle}</h2>
              <p>Step {step.id}</p>
            </Link>
            <h2>{step.stepTitle}</h2>
            <h4>Step {step.id}</h4>

            <ul>
              {step.tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong> - {task.detail.slice(0, 60)}...
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowHome;
