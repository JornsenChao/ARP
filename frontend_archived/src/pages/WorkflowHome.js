// src/pages/WorkflowHome.js
import React from 'react';
import { Link } from 'react-router-dom';
import workflowData from '../WorkflowData';
import './WorkflowHome.css';

function WorkflowHome() {
  return (
    <div className="workflow-fullscreen">
      <div className="steps-scroller">
        <div className="steps-line" />
        {workflowData.map((step) => (
          <div key={step.id} className="step-card">
            <h4>Step {step.id}</h4>
            <Link to={`/workflow/step/${step.id}`} className="step-card-link">
              <h2>{step.stepTitle}</h2>
            </Link>

            <ul>
              {step.tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong> -
                  <br />
                  {task.detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WorkflowHome;
