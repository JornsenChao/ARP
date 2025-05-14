// src/contexts/EssentialWorkflowContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { API_BASE as DOMAIN } from '../utils/apiBase';
import { getSessionId } from '../utils/sessionId'; // <-- 新增

// 单一workflow的上下文
export const EssentialWorkflowContext = createContext(null);

export function EssentialWorkflowProvider({ children }) {
  const [workflowState, setWorkflowState] = useState(null);

  // 拉取后端已有状态
  useEffect(() => {
    async function fetchState() {
      const sessionId = getSessionId();
      const res = await fetch(`${DOMAIN}/workflow?sessionId=${sessionId}`);
      const data = await res.json();
      setWorkflowState(data);
    }
    fetchState();
  }, []);

  // 提交到后端
  async function saveToBackend(newState) {
    const sessionId = getSessionId();
    const res = await fetch(`${DOMAIN}/workflow?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState),
    });
    const result = await res.json();
    console.log('Saved workflow state:', result);
  }

  // 更新 step1.hazards 并自动保存
  function updateStep1Hazards(newHazards) {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.hazards = newHazards;
      return updated;
    });
  }

  // 每次 workflowState 改变都自动调用 saveToBackend
  useEffect(() => {
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
