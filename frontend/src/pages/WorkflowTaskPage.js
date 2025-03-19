// src/pages/WorkflowTaskPage.js

import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, Toolbar, TextField } from '@mui/material';
import { WorkflowContext } from '../WorkflowContext';
import SidebarNavigation from '../components/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';

const drawerWidth = 240;

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const navigate = useNavigate();

  const { workflow, markTaskAsComplete, updateTaskNotes } =
    useContext(WorkflowContext);

  const [libraryOpen, setLibraryOpen] = useState(false);

  const sId = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);

  // 找到 Step
  const stepIndex = workflow.findIndex((s) => s.id === sId);
  if (stepIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Step not found</Typography>;
  }
  const step = workflow[stepIndex];

  // 如果 step.status !== 'current' => 整个任务页面只读
  const stepLocked = step.status !== 'current';

  // 找到 Task
  const taskIndex = step.tasks.findIndex((tk) => tk.id === tId);
  if (taskIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Task not found</Typography>;
  }
  const task = step.tasks[taskIndex];

  // 如果 step 已锁定, 则无论task是啥状态都只读
  // 否则再看 task.status 是否 current
  const isTaskLocked = stepLocked || task.status !== 'current';

  const isLastTask = taskIndex === step.tasks.length - 1;
  const isFirstTask = taskIndex === 0;

  const handleMarkComplete = () => {
    markTaskAsComplete(sId, tId);
    // 如果这是最后一个 task, markStepAsComplete => 下一个 step
    // 已在 context 里处理
    if (isLastTask) {
      // 跳回Step
      navigate(`/workflow/step/${sId}`);
    } else {
      // 下一个
      const nextTask = step.tasks[taskIndex + 1];
      navigate(`/workflow/step/${sId}/task/${nextTask.id}`);
    }
  };

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

  const handleChangeNotes = (e) => {
    if (isTaskLocked) return; // locked => 不更新
    updateTaskNotes(sId, tId, e.target.value);
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
          <Typography variant="body1" sx={{ mb: 2 }}>
            {task.detail}
          </Typography>

          {/* 如果 step 是 locked, 显示提示 */}
          {stepLocked && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This step is not active, so tasks are read-only.
            </Typography>
          )}

          {/* 笔记文本框 */}
          <TextField
            label="Notes"
            multiline
            rows={4}
            value={task.notes}
            onChange={handleChangeNotes}
            fullWidth
            InputProps={{
              readOnly: isTaskLocked,
            }}
            sx={{ mb: 3 }}
          />

          {/* Mark as Complete 只有在 step = current 且 task = current 才显示 */}
          {!isTaskLocked && (
            <Button
              variant="contained"
              onClick={handleMarkComplete}
              sx={{ mr: 2 }}
            >
              Mark as Complete
            </Button>
          )}

          {/* 上/下一任务 */}
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

          {/* 打开资源抽屉 */}
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

          {/* 返回step */}
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

      <ResrcPrecNotesLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        currentStepId={sId}
        currentTaskId={tId}
      />
    </Box>
  );
};

export default WorkflowTaskPage;
