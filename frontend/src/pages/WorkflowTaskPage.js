import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, Toolbar } from '@mui/material';
import { WorkflowContext } from '../WorkflowContext';
import SidebarNavigation from '../components/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';

const drawerWidth = 240;

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const navigate = useNavigate();
  const { workflow, markTaskAsComplete } = useContext(WorkflowContext);

  const [libraryOpen, setLibraryOpen] = useState(false);

  const sId = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);

  // 找到当前 Step
  const stepIndex = workflow.findIndex((s) => s.id === sId);
  if (stepIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Step not found</Typography>;
  }
  const step = workflow[stepIndex];

  // 找到当前任务
  const taskIndex = step.tasks.findIndex((tk) => tk.id === tId);
  if (taskIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Task not found</Typography>;
  }
  const task = step.tasks[taskIndex];

  // 判断该任务是否是 Step 内的最后一个
  const isLastTask = taskIndex === step.tasks.length - 1;

  // 标记完成并跳转
  const handleMarkComplete = () => {
    // 1) 更新状态：当前 task => finished, 下一个 upcoming => current
    markTaskAsComplete(sId, tId);

    // 2) 跳转逻辑：
    if (isLastTask) {
      // 如果这是本 Step 最后一个任务，完成后回到 Step 概览
      navigate(`/workflow/step/${sId}`);
    } else {
      // 否则自动前往下一个任务(新的 current)
      const nextTask = step.tasks[taskIndex + 1];
      navigate(`/workflow/step/${sId}/task/${nextTask.id}`);
    }
  };

  // 同一个 step 下的前/后任务
  const isFirstTask = taskIndex === 0;
  const handlePrevTask = () => {
    if (!isFirstTask) {
      const prevTask = step.tasks[taskIndex - 1];
      navigate(`/workflow/step/${sId}/task/${prevTask.id}`);
    }
  };
  const handleNextTask = () => {
    if (!isLastTask) {
      const nextTask = step.tasks[taskIndex + 1];
      navigate(`/workflow/step/${sId}/task/${nextTask.id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SidebarNavigation currentStepId={sId} currentTaskId={tId} />
      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px` }}>
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Task {taskId}: {task.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {task.detail}
          </Typography>

          <Button
            variant="contained"
            onClick={handleMarkComplete}
            sx={{ mr: 2 }}
          >
            Mark as Complete
          </Button>

          {/* 在同一 Step 内的 上/下一任务按钮 (可选) */}
          {!isFirstTask && (
            <Button variant="outlined" onClick={handlePrevTask} sx={{ mr: 1 }}>
              Previous Task
            </Button>
          )}
          {!isLastTask && (
            <Button variant="outlined" onClick={handleNextTask}>
              Next Task
            </Button>
          )}

          {/* 打开 Library 的按钮 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Need resources, precedents, or notes for this task?
            </Typography>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              component={Link}
              to={`/workflow/step/${sId}`}
            >
              Back to Step {step.id}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 右侧抽屉：Resource/Precedent/Notes */}
      <ResrcPrecNotesLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        currentStepId={sId}
        currentTaskId={tId} // 在任务页面，传入taskId
      />
    </Box>
  );
};

export default WorkflowTaskPage;
