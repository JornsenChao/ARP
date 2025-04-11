// src/contexts/WorkflowContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import initialData from '../data/WorkflowData';

export const RefWorkflowContext = createContext(null);

export const RefWorkflowProvider = ({ children }) => {
  const [workflow, setWorkflow] = useState(() => {
    const saved = localStorage.getItem('workflowState');
    if (saved) return JSON.parse(saved);
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('workflowState', JSON.stringify(workflow));
  }, [workflow]);

  // Update notes in a specific task
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
      const tasksCopy = [...stepCopy.tasks];

      const taskIndex = tasksCopy.findIndex((t) => t.id === taskId);
      if (taskIndex < 0) return newData;

      // 1) current task => finished
      tasksCopy[taskIndex] = { ...tasksCopy[taskIndex], status: 'finished' };

      // 2) find next upcoming => current
      const nextUpcomingIndex = tasksCopy.findIndex(
        (t) => t.status === 'upcoming'
      );
      if (nextUpcomingIndex >= 0) {
        tasksCopy[nextUpcomingIndex] = {
          ...tasksCopy[nextUpcomingIndex],
          status: 'current',
        };
      } else {
        // no next upcoming => all tasks done => step finished => unlock next step
        stepCopy.status = 'finished';

        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < newData.length) {
          const nextStep = { ...newData[nextStepIndex] };
          if (nextStep.status === 'upcoming') {
            nextStep.status = 'current';
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
    <RefWorkflowContext.Provider value={value}>
      {children}
    </RefWorkflowContext.Provider>
  );
};
