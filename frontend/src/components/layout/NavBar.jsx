// src/components/layout/NavBar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const NavBar = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Resilience Platform
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/ref-workflow">
            Reference Workflow
          </Button>
          {/* Essential Workflow */}
          <Button color="inherit" component={Link} to="/workflow">
            Essential Workflow
          </Button>
          {/* <Button color="inherit" component={Link} to="/resources">
            Resources
          </Button> */}
          {/* <Button color="inherit" component={Link} to="/precedents">
            Precedents
          </Button> */}
          {/* <Button color="inherit" component={Link} to="/notes">
            Notes
          </Button> */}
          {/* New: File Management & Step3 RAG */}
          <Button color="inherit" component={Link} to="/files">
            File Management
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
