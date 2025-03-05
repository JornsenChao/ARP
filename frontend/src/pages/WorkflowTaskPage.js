// src/pages/WorkflowTaskPage.js
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import workflowData from '../WorkflowData';
import SidebarNavigation from '../components/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';

// 引入我们新建的5个子任务组件
import ExposureToHazardsTask from './step4/ExposureToHazardsTask';
import EvaluateImpactTask from './step4/EvaluateImpactTask';
import AnalyzeLikelihoodTask from './step4/AnalyzeLikelihoodTask';
import RiskPrioritizationTask from './step4/RiskPrioritizationTask';
import ConsiderStressShockTask from './step4/ConsiderStressShockTask';

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const stepNum = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);
  const navigate = useNavigate();
  const [libraryOpen, setLibraryOpen] = useState(false);

  // 找到当前 step / task 的元信息
  const step = workflowData.find((s) => s.id === stepNum);
  if (!step) {
    return <div>Step not found.</div>;
  }
  const task = step.tasks.find((tk) => tk.id === tId);
  if (!task) {
    return <div>Task not found.</div>;
  }

  // 处理上一任务/下一任务 跳转 (可选)
  const tasksOfStep = step.tasks;
  const currentTaskIndex = tasksOfStep.findIndex((tk) => tk.id === tId);
  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = currentTaskIndex === tasksOfStep.length - 1;

  const handlePrevTask = () => {
    if (!isFirstTask) {
      const prevId = tasksOfStep[currentTaskIndex - 1].id;
      navigate(`/workflow/step/${stepNum}/task/${prevId}`);
    }
  };

  const handleNextTask = () => {
    if (!isLastTask) {
      const nextId = tasksOfStep[currentTaskIndex + 1].id;
      navigate(`/workflow/step/${stepNum}/task/${nextId}`);
    }
  };

  // 根据 stepId / taskId 动态渲染实际组件
  let TaskComponent = <div>Default or Old Logic</div>;
  if (stepNum === 4) {
    switch (tId) {
      case 401:
        TaskComponent = <ExposureToHazardsTask />;
        break;
      case 402:
        TaskComponent = <EvaluateImpactTask />;
        break;
      case 403:
        TaskComponent = <AnalyzeLikelihoodTask />;
        break;
      case 404:
        TaskComponent = <RiskPrioritizationTask />;
        break;
      case 405:
        TaskComponent = <ConsiderStressShockTask />;
        break;
      default:
        TaskComponent = <div>Unknown Sub-Task in Step 4</div>;
        break;
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {/* 左侧导航 (Permanent Drawer) */}
      <SidebarNavigation currentStepId={step.id} currentTaskId={task.id} />

      {/* 右侧主容器 */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <h1>Executing Task</h1>
        <p>
          Step {step.id}: {step.stepTitle}
        </p>
        <h2>Task: {task.title}</h2>
        <p>{task.detail}</p>

        {/* 这里渲染真正的子组件 */}
        {TaskComponent}

        {/* 打开右侧资源/先例/笔记抽屉 */}
        <button onClick={() => setLibraryOpen(true)}>
          Open Resource/Prec/Notes
        </button>
        <ResrcPrecNotesLibrary
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          currentStepId={step.id}
          currentTaskId={task.id}
        />

        {/* Prev/Next Task */}
        <div style={{ marginTop: '1rem' }}>
          {!isFirstTask && (
            <button onClick={handlePrevTask} style={{ marginRight: '1rem' }}>
              Previous Task
            </button>
          )}
          {!isLastTask && <button onClick={handleNextTask}>Next Task</button>}
        </div>

        <p style={{ marginTop: '1rem' }}>
          <Link to={`/workflow/step/${step.id}`}>Back to Step {step.id}</Link>
        </p>
      </div>
    </div>
  );
};

export default WorkflowTaskPage;
