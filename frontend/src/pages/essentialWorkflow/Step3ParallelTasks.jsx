// src/pages/Step3ParallelTasks.jsx
import React, { useContext, useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step3ParallelTasks() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );
  const [currentTab, setCurrentTab] = useState(0);

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step 3...</Box>;
  }

  const { step3 } = workflowState;

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  function markTaskComplete(taskKey) {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step3[taskKey].isCompleted = true;
      return updated;
    });
  }

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 3: ??
      </Typography>
      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Task A: Case Study" />
        <Tab label="Task B: Strategy" />
        <Tab label="Task C: Other Resources" />
      </Tabs>

      {/* Task A */}
      {currentTab === 0 && (
        <Box>
          <Typography variant="h6">Case Studies</Typography>
          <Typography paragraph>
            (Future RAG-based search / local doc retrieval... )
          </Typography>
          <Button variant="outlined" onClick={() => markTaskComplete('taskA')}>
            Mark as Complete
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Current status:{' '}
            {step3.taskA.isCompleted ? 'Completed' : 'Not Completed'}
          </Typography>
        </Box>
      )}
      {/* Task B */}
      {currentTab === 1 && (
        <Box>
          <Typography variant="h6">Strategy</Typography>
          <Typography paragraph>
            (Future RAG-based search / local doc retrieval... )
          </Typography>
          <Button variant="outlined" onClick={() => markTaskComplete('taskB')}>
            Mark as Complete
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Current status:{' '}
            {step3.taskB.isCompleted ? 'Completed' : 'Not Completed'}
          </Typography>
        </Box>
      )}
      {/* Task C */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6">Other Resources</Typography>
          <Typography paragraph>
            (Future RAG-based search for funds, grants, insurance, codes, etc.)
          </Typography>
          <Button variant="outlined" onClick={() => markTaskComplete('taskC')}>
            Mark as Complete
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Current status:{' '}
            {step3.taskC.isCompleted ? 'Completed' : 'Not Completed'}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" component={Link} to="/workflow/step4">
          Next Step: Summary
        </Button>
      </Box>
    </Box>
  );
}

export default Step3ParallelTasks;
