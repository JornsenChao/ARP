// src/pages/Step4Summary.jsx
import React, { useContext } from 'react';
import { Box, Button, Typography, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step4Summary() {
  const { workflowState } = useContext(EssentialWorkflowContext);

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step 4...</Box>;
  }

  const { step1, step2, step3 } = workflowState;

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 4: Summary & Export
      </Typography>

      <Typography variant="h6">Step1 Hazards:</Typography>
      <Typography>
        {step1.hazards.join(', ') || 'No hazards selected'}
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Step2 Completed? {step2.isCompleted ? 'Yes' : 'No'}
      </Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Step3 Tasks:
      </Typography>
      <Typography>
        Task A: {step3.taskA.isCompleted ? 'Done' : 'Not Done'}
      </Typography>
      <Typography>
        Task B: {step3.taskB.isCompleted ? 'Done' : 'Not Done'}
      </Typography>
      <Typography>
        Task C: {step3.taskC.isCompleted ? 'Done' : 'Not Done'}
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained">Export Report (TODO)</Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Button variant="text" component={Link} to="/workflow">
          Back to Workflow Home
        </Button>
      </Box>
    </Box>
  );
}

export default Step4Summary;
