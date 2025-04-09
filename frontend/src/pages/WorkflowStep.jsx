// src/pages/WorkflowStep.jsx

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
import { WorkflowContext } from '../contexts/WorkflowContext';
import SidebarNavigation from '../components/layout/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/library/ResrcPrecNotesLibrary';

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
  const stepLocked = (step.status !== 'current');

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === workflow.length - 1;

  const handlePrevStep = () => {
    if (!isFirstStep) {
      const prevStepId = workflow[stepIndex - 1].id;
      navigate(`/workflow/step/${prevStepId}`);
    }
  };

  const handleNextStep = () => {
    if (!isLastStep) {
      const nextStepId = workflow[stepIndex + 1].id;
      navigate(`/workflow/step/${nextStepId}`);
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

          {/* Indicate step status */}
          {step.status === 'finished' && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This step is completed (read-only).
            </Typography>
          )}
          {step.status === 'upcoming' && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This step is locked (not started yet).
            </Typography>
          )}
          {step.status === 'current' && (
            <Typography sx={{ fontWeight: 'bold', mb: 2 }}>
              This step is active - you may continue tasks here.
            </Typography>
          )}

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Tasks in Step {step.id}
            </Typography>
            <Stack spacing={2}>
              {step.tasks.map((task) => {
                const color = statusColors[task.status] || 'text.secondary';
                // If stepLocked or task is not current => locked
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
                    {/* If it's upcoming, add a transparent overlay + tooltip */}
                    {task.status === 'upcoming' && (
                      <Tooltip
                        title={`(Upcoming) ${task.title} - ${task.detail}`}
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
                    {task.status !== 'upcoming' && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {task.detail}
                      </Typography>
                    )}

                    {/* Show "View" if not upcoming */}
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

          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

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
