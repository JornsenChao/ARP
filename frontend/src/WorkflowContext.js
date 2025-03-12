// src/WorkflowContext.js

import React, { createContext, useState, useEffect } from 'react';
import initialData from './WorkflowData';

export const WorkflowContext = createContext(null);

export const WorkflowProvider = ({ children }) => {
  const [workflow, setWorkflow] = useState(() => {
    // 初始时尝试从 localStorage 恢复
    const saved = localStorage.getItem('workflowState');
    if (saved) {
      return JSON.parse(saved);
    }
    return initialData;
  });

  // 每次 workflow 改变时，存入 localStorage
  useEffect(() => {
    localStorage.setItem('workflowState', JSON.stringify(workflow));
  }, [workflow]);

  // 根据 stepId / taskId 标记任务完成
  const markTaskAsComplete = (stepId, taskId) => {
    setWorkflow((prev) => {
      const newData = [...prev];
      const stepIndex = newData.findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return newData;

      const step = { ...newData[stepIndex] };
      const tasks = step.tasks.map((task, i) => {
        if (task.id === taskId) {
          // 当前任务设为 finished
          return { ...task, status: 'finished' };
        }
        return task;
      });

      // 让下一个 upcoming 的任务变为 current
      let nextTaskIndex = tasks.findIndex((t) => t.status === 'upcoming');
      if (nextTaskIndex >= 0) {
        tasks[nextTaskIndex] = {
          ...tasks[nextTaskIndex],
          status: 'current',
        };
      } else {
        // 如果没有 upcoming，说明这个 step 下所有任务都完成了
        // 可在此处做“自动跳转下一个Step”的处理，但跳转逻辑也可在组件中写
      }

      step.tasks = tasks;
      newData[stepIndex] = step;
      return newData;
    });
  };

  // 辅助：获取指定 Step 的下一个 stepId，用于自动跳转
  const getNextStepId = (stepId) => {
    const index = workflow.findIndex((s) => s.id === stepId);
    if (index >= 0 && index < workflow.length - 1) {
      return workflow[index + 1].id;
    }
    return null; // 没有下一个 step
  };

  // 辅助：判断某个 Step 是否所有 task 都 finished
  const isStepAllFinished = (stepId) => {
    const step = workflow.find((s) => s.id === stepId);
    if (!step) return false;
    return step.tasks.every((t) => t.status === 'finished');
  };

  const value = {
    workflow,
    setWorkflow,
    markTaskAsComplete,
    getNextStepId,
    isStepAllFinished,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
