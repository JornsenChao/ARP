// src/pages/WorkflowTaskPage.js

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import workflowData from '../WorkflowData';
import './WorkflowTaskPage.css';

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const stepNum = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);

  const step = workflowData.find((s) => s.id === stepNum);
  if (!step) {
    return <div>Step not found.</div>;
  }

  const task = step.tasks.find((tk) => tk.id === tId);
  if (!task) {
    return <div>Task not found.</div>;
  }

  return (
    <div className="task-exec-container">
      <h1>Executing Task</h1>
      <p>
        Step {step.id}: {step.stepTitle}
      </p>
      <h2>Task: {task.title}</h2>
      <p>{task.detail}</p>

      <p>
        Here you can implement the actual process for completing this task...
      </p>

      <Link to={`/workflow/step/${stepId}`}>
        <button>Back to Step {stepId}</button>
      </Link>
    </div>
  );
};

export default WorkflowTaskPage;
