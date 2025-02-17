// src/pages/WorkflowStep.js

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import workflowData from '../WorkflowData';
import WorkflowTaskModal from './WorkflowTaskModal';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';
import './WorkflowStep.css';

const WorkflowStep = () => {
  const { stepId } = useParams();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const stepNum = parseInt(stepId, 10);

  const step = workflowData.find((s) => s.id === stepNum);
  const navigate = useNavigate();

  // 管理 modal 的打开关闭状态，以及当前选中的 task
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  if (!step) {
    return <div>Step not found.</div>;
  }

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

  return (
    <div className="workflow-step-container">
      <h1>
        Step {step.id}: {step.stepTitle}
      </h1>
      <p>
        <strong>Deliverable:</strong> {step.deliverable}
      </p>

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

      <br />
      <h2>Resources and Precedents</h2>
      <button onClick={openResourceLibrary}>Open Resource Library</button>
      {/* 这里是核心：条件渲染侧边面板 */}
      <ResrcPrecNotesLibrary
        isOpen={libraryOpen}
        onClose={closeResourceLibrary}
      />
      {modalOpen && selectedTask && (
        <WorkflowTaskModal task={selectedTask} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default WorkflowStep;
