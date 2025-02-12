// src/pages/WorkflowTaskPage.js

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import workflowData from '../WorkflowData';
import ResourceLibrary from '../components/ResrcPrecLibrary/ResrcPrecLibrary';
import './WorkflowTaskPage.css';

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const [libraryOpen, setLibraryOpen] = useState(false);
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
  // 当用户点击 "Open Resource" 时，显示面板
  const openResourceLibrary = () => setLibraryOpen(true);
  // 当用户关闭面板时
  const closeResourceLibrary = () => setLibraryOpen(false);

  return (
    <div className="task-exec-container">
      <h1>Executing Task</h1>
      <p>
        Step {step.id}: {step.stepTitle}
      </p>
      <h2>Task: {task.title}</h2>
      <p>{task.detail}</p>
      <button onClick={openResourceLibrary}>Open Resource Library</button>

      {/* 这里是核心：条件渲染侧边面板 */}
      <ResourceLibrary isOpen={libraryOpen} onClose={closeResourceLibrary} />
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
