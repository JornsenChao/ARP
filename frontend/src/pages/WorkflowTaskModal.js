// src/pages/WorkflowTaskModal.js

import React from 'react';
import './WorkflowTaskModal.css';

const WorkflowTaskModal = ({ task, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()} /* 防止点击内容区关闭modal */
      >
        <h2>{task.title}</h2>
        <p>{task.detail}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default WorkflowTaskModal;
