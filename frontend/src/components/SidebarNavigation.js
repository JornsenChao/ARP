// src/components/SidebarNavigation.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import workflowData from '../WorkflowData';
import './SidebarNavigation.css';

const SidebarNavigation = ({ currentStepId, currentTaskId }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar-nav">
      <h3>Workflow Steps</h3>
      <ul className="sidebar-step-list">
        {workflowData.map((step) => (
          <li key={step.id}>
            {/* Step 链接 */}
            <Link
              to={`/workflow/step/${step.id}`}
              className={step.id === currentStepId ? 'active-step-link' : ''}
            >
              Step {step.id}: {step.stepTitle}
            </Link>

            {/* 如果 step 里有 tasks，就列出来 */}
            {step.tasks && step.tasks.length > 0 && (
              <ul className="sidebar-task-list">
                {step.tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/workflow/step/${step.id}/task/${task.id}`}
                      className={
                        step.id === currentStepId && task.id === currentTaskId
                          ? 'active-task-link'
                          : ''
                      }
                    >
                      {task.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarNavigation;
