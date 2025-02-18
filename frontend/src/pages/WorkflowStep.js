// src/pages/WorkflowStep.js

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import workflowData from '../WorkflowData';
import WorkflowTaskModal from './WorkflowTaskModal';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';
import SidebarNavigation from '../components/SidebarNavigation';
import './WorkflowStep.css';

const WorkflowStep = () => {
  const { stepId } = useParams();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const navigate = useNavigate();

  const stepNum = parseInt(stepId, 10);
  const step = workflowData.find((s) => s.id === stepNum);
  if (!step) {
    return <div>Step not found.</div>;
  }

  // ---------------------------------------
  // 侧边导航
  // ---------------------------------------
  // 让 SidebarNavigation 知道我们当前 stepId = stepNum, taskId=null
  // 这样就能高亮当前 Step
  // 并在左侧列出所有 steps & tasks
  // ---------------------------------------

  // ---------------------------------------
  // Modal 相关（原有）
  // ---------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleSeeDetails = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleStartTask = (taskId) => {
    navigate(`/workflow/step/${stepId}/task/${taskId}`);
  };
  const openResourceLibrary = () => setLibraryOpen(true);
  const closeResourceLibrary = () => setLibraryOpen(false);

  // ---------------------------------------
  // Prev / Next Step
  // ---------------------------------------
  // 对比 workflowData 的 first / last step
  const totalSteps = workflowData.length;
  const currentIndex = workflowData.findIndex((s) => s.id === stepNum);
  // currentIndex 可能是 0~(totalSteps-1)
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === totalSteps - 1;

  const handlePrevStep = () => {
    if (!isFirstStep) {
      const prevStepId = workflowData[currentIndex - 1].id;
      navigate(`/workflow/step/${prevStepId}`);
    }
  };
  const handleNextStep = () => {
    if (!isLastStep) {
      const nextStepId = workflowData[currentIndex + 1].id;
      navigate(`/workflow/step/${nextStepId}`);
    }
  };

  return (
    <div className="workflow-step-layout">
      {/* 左侧导航 */}
      <SidebarNavigation currentStepId={stepNum} currentTaskId={null} />

      {/* 右侧主内容 */}
      <div className="workflow-step-content">
        <h1>
          Step {step.id}: {step.stepTitle}
        </h1>

        {/* Step中的Tasks */}
        <div className="task-cards-container">
          {step.tasks.map((task) => (
            <div key={task.id} className="task-card">
              <h3>{task.title}</h3>
              <div className="task-card-actions">
                <button onClick={() => handleSeeDetails(task)}>
                  See Details
                </button>
                <button onClick={() => handleStartTask(task.id)}>
                  Start Task
                </button>
              </div>
            </div>
          ))}
        </div>
        <h3>
          <strong>Deliverable:</strong> {step.deliverable}
        </h3>
        <h2>Resources, Precedents, and Notes</h2>
        <button onClick={openResourceLibrary}>Open Resource/Prec/Notes</button>
        {/* 这里是核心：条件渲染侧边面板 */}
        <ResrcPrecNotesLibrary
          isOpen={libraryOpen}
          onClose={closeResourceLibrary}
        />
        {/* Modal */}
        {modalOpen && selectedTask && (
          <WorkflowTaskModal task={selectedTask} onClose={handleCloseModal} />
        )}

        {/* Prev / Next Step 按钮 */}
        <div className="step-nav-buttons">
          {!isFirstStep && (
            <button onClick={handlePrevStep}>Previous Step</button>
          )}
          {!isLastStep && <button onClick={handleNextStep}>Next Step</button>}
        </div>

        <br />
        <Link to="/workflow">Back to Workflow Home</Link>
      </div>
    </div>
  );
};

export default WorkflowStep;
