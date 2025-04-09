// src/pages/WorkflowTaskPage.jsx

import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Toolbar,
  TextField,
} from '@mui/material';
import { WorkflowContext } from '../contexts/WorkflowContext';
import SidebarNavigation from '../components/layout/SidebarNavigation';
import ResrcPrecNotesLibrary from '../components/library/ResrcPrecNotesLibrary';

const drawerWidth = 240;

const WorkflowTaskPage = () => {
  const { stepId, taskId } = useParams();
  const navigate = useNavigate();

  const {
    workflow,
    markTaskAsComplete,
    updateTaskNotes,
  } = useContext(WorkflowContext);

  const [libraryOpen, setLibraryOpen] = useState(false);

  const sId = parseInt(stepId, 10);
  const tId = parseInt(taskId, 10);

  // Find the Step
  const stepIndex = workflow.findIndex((s) => s.id === sId);
  if (stepIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Step not found.</Typography>;
  }
  const step = workflow[stepIndex];
  // Step locked if not 'current'
  const stepLocked = step.status !== 'current';

  // Find the Task
  const taskIndex = step.tasks.findIndex((t) => t.id === tId);
  if (taskIndex < 0) {
    return <Typography sx={{ mt: 8, ml: 2 }}>Task not found.</Typography>;
  }
  const task = step.tasks[taskIndex];
  // Task locked if step locked OR task not 'current'
  const taskLocked = stepLocked || (task.status !== 'current');

  const isLastTask = (taskIndex === step.tasks.length - 1);
  const isFirstTask = (taskIndex === 0);

  const handleMarkComplete = () => {
    markTaskAsComplete(sId, tId);
    if (isLastTask) {
      // Go back to step page
      navigate(`/workflow/step/${sId}`);
    } else {
      // Move on to next task
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
    if (taskLocked) return;
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

          {stepLocked && (
            <Typography sx={{ color: 'text.disabled', mb: 2 }}>
              This Step is not active. Tasks are read-only.
            </Typography>
          )}

          <TextField
            label="Notes"
            multiline
            rows={4}
            value={task.notes}
            onChange={handleChangeNotes}
            fullWidth
            InputProps={{
              readOnly: taskLocked,
            }}
            sx={{ mb: 3 }}
          />

          {!taskLocked && (
            <Button
              variant="contained"
              onClick={handleMarkComplete}
              sx={{ mr: 2 }}
            >
              Mark as Complete
            </Button>
          )}

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

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Library
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button variant="text" component={Link} to={`/workflow/step/${sId}`}>
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
