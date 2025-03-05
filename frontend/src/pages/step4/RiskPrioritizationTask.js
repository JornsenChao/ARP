// src/pages/step4/RiskPrioritizationTask.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const RiskPrioritizationTask = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Risk Prioritization
      </Typography>
      <Typography>
        Placeholder: The Risk Score is a combination of Exposure, Impact, and
        Likelihood. Future work: Automatically rank the hazards based on the
        Risk Score.
      </Typography>
    </Box>
  );
};

export default RiskPrioritizationTask;
