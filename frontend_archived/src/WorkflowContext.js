// src/WorkflowContext.js

import React, { createContext, useState, useEffect } from 'react';
import initialData from './WorkflowData';

export const WorkflowContext = createContext(null);

export const WorkflowProvider = ({ children }) => {
  const [workflow, setWorkflow] = useState(() => {
    const saved = localStorage.getItem('workflowState');
    if (saved) return JSON.parse(saved);
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('workflowState', JSON.stringify(workflow));
  }, [workflow]);

  // 更新某个task的notes
  const updateTaskNotes = (stepId, taskId, newNotes) => {
    setWorkflow((prev) => {
      const newData = [...prev];
      const stepIndex = newData.findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return newData;

      const stepCopy = { ...newData[stepIndex] };
      stepCopy.tasks = stepCopy.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, notes: newNotes };
        }
        return task;
      });
      newData[stepIndex] = stepCopy;
      return newData;
    });
  };

  // Mark a single task as complete
  const markTaskAsComplete = (stepId, taskId) => {
    setWorkflow((prev) => {
      const newData = [...prev];
      const stepIndex = newData.findIndex((s) => s.id === stepId);
      if (stepIndex < 0) return newData;

      const stepCopy = { ...newData[stepIndex] };
      // 找到这个 task
      const taskIndex = stepCopy.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex < 0) return newData;

      // 1) 当前task => finished
      const tasksCopy = [...stepCopy.tasks];
      tasksCopy[taskIndex] = {
        ...tasksCopy[taskIndex],
        status: 'finished',
      };

      // 2) 找下一个 upcoming => current
      const nextUpcomingIndex = tasksCopy.findIndex(
        (t) => t.status === 'upcoming'
      );
      if (nextUpcomingIndex >= 0) {
        tasksCopy[nextUpcomingIndex] = {
          ...tasksCopy[nextUpcomingIndex],
          status: 'current',
        };
      } else {
        // 没有下一个任务 => 说明本step所有任务都完成
        // => mark this step as finished, unlock the next step
        stepCopy.status = 'finished';

        // 解锁下一个step
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < newData.length) {
          // 如果还有后续 step
          const nextStep = { ...newData[nextStepIndex] };
          // 如果是 upcoming，则变成 current
          if (nextStep.status === 'upcoming') {
            nextStep.status = 'current';
            // 其第一个任务也要从 upcoming => current
            if (nextStep.tasks.length > 0) {
              nextStep.tasks = nextStep.tasks.map((tk, i) => {
                if (i === 0) return { ...tk, status: 'current' };
                return tk;
              });
            }
          }
          newData[nextStepIndex] = nextStep;
        }
      }

      stepCopy.tasks = tasksCopy;
      newData[stepIndex] = stepCopy;
      return newData;
    });
  };

  const value = {
    workflow,
    setWorkflow,
    updateTaskNotes,
    markTaskAsComplete,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
