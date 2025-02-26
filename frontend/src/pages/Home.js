// src/pages/Home.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const Home = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the Resilience Design Workflow Platform
      </Typography>
      <Typography variant="body1">
        This demo shows basic navigation, task interaction, and resource search
        functionality.
      </Typography>
    </Box>
  );
};

export default Home;
