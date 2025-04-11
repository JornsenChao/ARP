// src/pages/EssentialWorkflowHome.jsx
import React from 'react';
import { Box, Button, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

function EssentialWorkflowHome() {
  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Essential Workflow Home
      </Typography>
      <Typography variant="body1" paragraph>
        This is the new 4-step workflow. Please proceed step by step.
      </Typography>

      {/* 示例：导航按钮 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" component={Link} to="/workflow/step1">
          Go to Step 1
        </Button>
        <Button variant="outlined" component={Link} to="/workflow/step2">
          Go to Step 2
        </Button>
        <Button variant="outlined" component={Link} to="/workflow/step3">
          Go to Step 3
        </Button>
        <Button variant="outlined" component={Link} to="/workflow/step4">
          Go to Step 4
        </Button>
      </Box>
    </Box>
  );
}

export default EssentialWorkflowHome;
