import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Typography,
  Button,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import { WorkflowContext } from '../WorkflowContext';
import SidebarNavigation from '../components/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary'; // 引入库抽屉

const statusColors = {
  finished: 'text.disabled',
  current: 'primary.main',
  upcoming: 'text.secondary',
};

const drawerWidth = 240;

const WorkflowStep = () => {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { workflow, setWorkflow } = useContext(WorkflowContext);

  // 用于控制资源/先例/笔记抽屉
  const [libraryOpen, setLibraryOpen] = useState(false);

  const stepNum = parseInt(stepId, 10);
  const stepIndex = workflow.findIndex((s) => s.id === stepNum);
  if (stepIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Step not found.</Typography>;
  }
  const step = workflow[stepIndex];

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === workflow.length - 1;

  const handlePrevStep = () => {
    if (!isFirstStep) {
      const prevId = workflow[stepIndex - 1].id;
      navigate(`/workflow/step/${prevId}`);
    }
  };
  const handleNextStep = () => {
    if (!isLastStep) {
      const nextId = workflow[stepIndex + 1].id;
      navigate(`/workflow/step/${nextId}`);
    }
  };

  // 找当前task
  const currentTask = step.tasks.find((t) => t.status === 'current');
  // 是否所有完成
  const allFinished = step.tasks.every((t) => t.status === 'finished');
  // 是否有未开始
  const hasUpcoming = step.tasks.some((t) => t.status === 'upcoming');

  // 若没有currentTask但有upcoming => 可以手动启动
  const handleStartFirstUpcoming = () => {
    const upcomingIndex = step.tasks.findIndex((t) => t.status === 'upcoming');
    if (upcomingIndex < 0) return;

    const upcomingTaskId = step.tasks[upcomingIndex].id;
    // 把它设为 current
    const newWorkflow = [...workflow];
    const stepCopy = { ...newWorkflow[stepIndex] };
    const tasksCopy = stepCopy.tasks.map((task, i) => {
      if (i === upcomingIndex) {
        return { ...task, status: 'current' };
      }
      return task;
    });
    stepCopy.tasks = tasksCopy;
    newWorkflow[stepIndex] = stepCopy;
    setWorkflow(newWorkflow);

    // 导航过去
    navigate(`/workflow/step/${step.id}/task/${upcomingTaskId}`);
  };

  // 如果有 currentTask，顶部“Start”按钮点击
  const handleStartCurrentTask = () => {
    if (currentTask) {
      navigate(`/workflow/step/${step.id}/task/${currentTask.id}`);
    }
  };

  // 回到当前任务
  const goBackToCurrentTask = () => {
    if (currentTask) {
      navigate(`/workflow/step/${step.id}/task/${currentTask.id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SidebarNavigation currentStepId={step.id} currentTaskId={null} />
      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px` }}>
        <Toolbar />

        <Box sx={{ p: 2 }}>
          <Typography variant="h4" gutterBottom>
            Step {step.id}: {step.stepTitle}
          </Typography>

          {/* Expected Deliverable + tooltip */}
          <Tooltip title={step.deliverableDetail} arrow enterDelay={200}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {step.deliverable}
            </Typography>
          </Tooltip>

          {/* 顶部显示当前任务及 Start 按钮 */}
          {currentTask ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Current Task: {currentTask.title}
              </Typography>
              <Button variant="contained" onClick={handleStartCurrentTask}>
                Start {currentTask.title}
              </Button>
            </Box>
          ) : allFinished ? (
            <Typography
              variant="subtitle1"
              sx={{ color: 'text.disabled', mb: 3 }}
            >
              All tasks in this step are completed.
            </Typography>
          ) : (
            hasUpcoming && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  No task is currently active. You can start this step by
                  launching the first upcoming task.
                </Typography>
                <Button variant="contained" onClick={handleStartFirstUpcoming}>
                  Start the first upcoming Task
                </Button>
              </Box>
            )
          )}

          {/* 打开资源/先例/笔记抽屉 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Need references or notes for this step?
            </Typography>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

          {/* 列出所有任务(无 Start 按钮) */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Tasks in Step {step.id}
            </Typography>
            <Stack spacing={2}>
              {step.tasks.map((task) => {
                const color = statusColors[task.status] || 'text.secondary';
                return (
                  <Box
                    key={task.id}
                    sx={{
                      p: 2,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color, mb: 1 }}>
                      {task.title} ({task.status.toUpperCase()})
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {task.detail}
                    </Typography>

                    {task.status === 'finished' && (
                      <Button variant="outlined" disabled>
                        View (Finished)
                      </Button>
                    )}
                    {task.status === 'current' && (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate(`/workflow/step/${step.id}/task/${task.id}`)
                        }
                      >
                        View
                      </Button>
                    )}
                    {task.status === 'upcoming' && (
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate(`/workflow/step/${step.id}/task/${task.id}`)
                        }
                      >
                        View
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* 底部导航按钮 */}
          <Box sx={{ mt: 3 }}>
            {!isFirstStep && (
              <Button
                variant="outlined"
                onClick={handlePrevStep}
                sx={{ mr: 1 }}
              >
                Previous Step
              </Button>
            )}
            {!isLastStep && (
              <Button variant="outlined" onClick={handleNextStep}>
                Next Step
              </Button>
            )}
          </Box>

          {/* 如果有 currentTask，提供回到当前任务按钮 */}
          {currentTask && (
            <Box sx={{ mt: 2 }}>
              <Button variant="text" onClick={goBackToCurrentTask}>
                Go back to current task
              </Button>
            </Box>
          )}

          {/* 返回总览 */}
          <Box sx={{ mt: 2 }}>
            <Button variant="text" component={Link} to="/workflow">
              Back to Workflow Overview
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 右侧抽屉：Resource/Precedent/Notes */}
      <ResrcPrecNotesLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        currentStepId={step.id}
        // 当前不在任务页面，所以可以把 currentTaskId 传 null，或省略
        currentTaskId={null}
      />
    </Box>
  );
};

export default WorkflowStep;
