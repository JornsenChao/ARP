// src/pages/WorkflowTaskPage.js

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import workflowData from '../WorkflowData';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';
import SidebarNavigation from '../components/SidebarNavigation'; // 新增
import './WorkflowTaskPage.css';

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const stepNum = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);
  const navigate = useNavigate();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const step = workflowData.find((s) => s.id === stepNum);
  if (!step) {
    return <div>Step not found.</div>;
  }
  const task = step.tasks.find((tk) => tk.id === tId);
  if (!task) {
    return <div>Task not found.</div>;
  }
  // ---------------------------------------
  // 侧边导航
  // ---------------------------------------
  // 在 Task 页面，就把 currentStepId = step.id， currentTaskId = task.id
  // 这样导航栏会高亮对应 step / task
  // ---------------------------------------

  // 控制资源/先例/笔记面板
  const openResourceLibrary = () => setLibraryOpen(true);
  const closeResourceLibrary = () => setLibraryOpen(false);

  // ---------------------------------------
  // Prev / Next Task (在同一个 Step 内)
  // ---------------------------------------
  const tasksOfStep = step.tasks; // 该 Step 下所有 tasks
  // 找出当前task在 tasksOfStep 数组中的位置
  const currentTaskIndex = tasksOfStep.findIndex((tk) => tk.id === tId);
  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = currentTaskIndex === tasksOfStep.length - 1;

  const handlePrevTask = () => {
    if (!isFirstTask) {
      const prevTaskId = tasksOfStep[currentTaskIndex - 1].id;
      navigate(`/workflow/step/${stepNum}/task/${prevTaskId}`);
    }
  };
  const handleNextTask = () => {
    if (!isLastTask) {
      const nextTaskId = tasksOfStep[currentTaskIndex + 1].id;
      navigate(`/workflow/step/${stepNum}/task/${nextTaskId}`);
    }
  };

  return (
    <div className="task-page-layout">
      {/* 左侧导航 */}
      <SidebarNavigation currentStepId={step.id} currentTaskId={task.id} />

      {/* 右侧主区 */}
      <div className="task-exec-container">
        <h1>Executing Task</h1>
        <p>
          Step {step.id}: {step.stepTitle}
        </p>
        <h2>Task: {task.title}</h2>
        <p>{task.detail}</p>
        {/* 打开资源/先例/笔记面板 */}
        <button onClick={openResourceLibrary}>Open Resource/Prec/Notes</button>
        <ResrcPrecNotesLibrary
          isOpen={libraryOpen}
          onClose={closeResourceLibrary}
          currentStepId={step.id}
          currentTaskId={task.id}
        />
        <p>
          Here you can implement the actual process for completing this task...
        </p>

        <div className="task-nav-buttons">
          {!isFirstTask && (
            <button onClick={handlePrevTask}>Previous Task</button>
          )}
          {!isLastTask && <button onClick={handleNextTask}>Next Task</button>}
        </div>

        <Link to={`/workflow/step/${step.id}`}>
          <button>Back to Step {step.id}</button>
        </Link>
      </div>
    </div>
  );
};

export default WorkflowTaskPage;
