// src/pages/WorkflowStep.js

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
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';

const statusColors = {
  finished: 'text.disabled',
  current: 'primary.main',
  upcoming: 'text.secondary',
};

const drawerWidth = 240;

const WorkflowStep = () => {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { workflow } = useContext(WorkflowContext);

  const [libraryOpen, setLibraryOpen] = useState(false);

  const sId = parseInt(stepId, 10);
  const stepIndex = workflow.findIndex((s) => s.id === sId);
  if (stepIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Step not found</Typography>;
  }
  const step = workflow[stepIndex];
  const stepLocked = (step.status !== 'current'); // Step locked unless status = current

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === workflow.length - 1;

  const handlePrevStep = () => {
    if (!isFirstStep) {
      navigate(`/workflow/step/${workflow[stepIndex - 1].id}`);
    }
  };
  const handleNextStep = () => {
    if (!isLastStep) {
      navigate(`/workflow/step/${workflow[stepIndex + 1].id}`);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <SidebarNavigation currentStepId={sId} currentTaskId={null} />

      <Box component="main" sx={{ flexGrow: 1, ml: `${drawerWidth}px` }}>
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="h4" gutterBottom>
            Step {step.id}: {step.stepTitle}
          </Typography>

          <Tooltip title={step.deliverableDetail} arrow enterDelay={300}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {step.deliverable}
            </Typography>
          </Tooltip>

          {/* 如果 Step 是 finished / upcoming / current，都可以显示任务列表，但交互不同 */}
          {step.status === 'finished' && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This step has been completed (read-only).
            </Typography>
          )}
          {step.status === 'upcoming' && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This step is locked (cannot start yet).
            </Typography>
          )}
          {step.status === 'current' && (
            <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
              This step is active. You may continue or finish tasks below.
            </Typography>
          )}

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Tasks in Step {step.id}
            </Typography>
            <Stack spacing={2}>
              {step.tasks.map((task) => {
                const color = statusColors[task.status] || 'text.secondary';

                // 任务的 locked 状态 = stepLocked 或 task.status !== 'current'
                // 但是这里仅用于区分UI; "View"或 hover
                const taskLocked = stepLocked || (task.status !== 'current');

                return (
                  <Box
                    key={task.id}
                    sx={{
                      p: 2,
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      position: 'relative',
                    }}
                  >
                    {/* 如果是 upcoming，就用tooltip hover */}
                    {task.status === 'upcoming' && (
                      <Tooltip
                        title={`(Upcoming) ${task.title}: ${task.detail}`}
                        arrow
                        enterDelay={300}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      </Tooltip>
                    )}

                    <Typography variant="subtitle1" sx={{ color, mb: 1 }}>
                      {task.title} ({task.status.toUpperCase()})
                      {taskLocked && ' - LOCKED'}
                    </Typography>
                    {/* optional: could show brief detail */}
                    {task.status !== 'upcoming' && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {task.detail}
                      </Typography>
                    )}

                    {/* “View”按钮仅在 finished 或 current 任务上显示
                        但若 stepLocked && task.status===current => 也可查看(只读)
                        => 因此只要 task不是 upcoming就给个View按钮 */}
                    {task.status !== 'upcoming' && (
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

          {/* 底部 step导航 */}
          <Box sx={{ mt: 3 }}>
            {!isFirstStep && (
              <Button variant="outlined" onClick={handlePrevStep} sx={{ mr: 1 }}>
                Previous Step
              </Button>
            )}
            {!isLastStep && (
              <Button variant="outlined" onClick={handleNextStep}>
                Next Step
              </Button>
            )}
          </Box>

          {/* 打开图书馆/抽屉 */}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

          {/* 返回workflow总览 */}
          <Box sx={{ mt: 2 }}>
            <Button variant="text" component={Link} to="/workflow">
              Back to Workflow Overview
            </Button>
          </Box>
        </Box>
      </Box>

      <ResrcPrecNotesLibrary
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        currentStepId={step.id}
        currentTaskId={null}
      />
    </Box>
  );
};

export default WorkflowStep;
