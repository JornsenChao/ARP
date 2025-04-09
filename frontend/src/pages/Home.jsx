// src/pages/Home.jsx

import React from 'react';
import { Box, Toolbar, Typography } from '@mui/material';

function Home() {
  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Welcome to the Resilience Design Platform
      </Typography>
      <Typography variant="body1">
        This demo shows the basic navigation, workflow steps, tasks, and resource library features.
      </Typography>
    </Box>
  );
}

export default Home;
