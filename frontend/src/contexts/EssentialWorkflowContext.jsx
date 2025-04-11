// src/contexts/EssentialWorkflowContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const EssentialWorkflowContext = createContext(null);

export function EssentialWorkflowProvider({ projectId, children }) {
  const [workflowState, setWorkflowState] = useState(null);

  // 拉取后端已有状态
  useEffect(() => {
    async function fetchState() {
      const res = await fetch(`http://localhost:8000/workflow/${projectId}`);
      const data = await res.json();
      setWorkflowState(data);
    }
    fetchState();
  }, [projectId]);

  // 提交到后端
  async function saveToBackend(newState) {
    const res = await fetch(`http://localhost:8000/workflow/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState),
    });
    const result = await res.json();
    console.log('Saved workflow state:', result);
  }

  // 一个示例：更新局部状态 + 自动保存
  function updateStep1Hazards(newHazards) {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.hazards = newHazards;
      return updated;
    });
  }

  // 可以在组件销毁或点击按钮时 saveToBackend
  useEffect(() => {
    // 这里简化示例：每次 workflowState 改变都自动提交
    // 实际可在用户点“Save”或“Next Step”时调用
    if (workflowState) {
      saveToBackend(workflowState);
    }
  }, [workflowState]);

  return (
    <EssentialWorkflowContext.Provider
      value={{
        workflowState,
        setWorkflowState,
        updateStep1Hazards,
      }}
    >
      {children}
    </EssentialWorkflowContext.Provider>
  );
}
