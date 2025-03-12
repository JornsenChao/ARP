// src/components/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Resilience Platform
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/workflow">
            Workflow
          </Button>
          <Button color="inherit" component={Link} to="/tasks">
            Tasks
          </Button>
          <Button color="inherit" component={Link} to="/notes">
            Notes
          </Button>
          <Button color="inherit" component={Link} to="/resources">
            Resources
          </Button>
          <Button color="inherit" component={Link} to="/precedents">
            Precedents
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
