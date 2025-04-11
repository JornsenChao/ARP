// src/components/layout/SidebarNavigation.jsx

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { RefWorkflowContext } from '../../contexts/RefWorkflowContext';

const drawerWidth = 240;

const SidebarNavigation = ({ currentStepId, currentTaskId }) => {
  const { workflow } = useContext(RefWorkflowContext);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: '64px', // offset from top NavBar
        },
      }}
    >
      <List disablePadding>
        <ListItemText
          primary={
            <Typography variant="h6" sx={{ px: 2, py: 1 }}>
              Workflow Steps
            </Typography>
          }
        />
        {workflow.map((step) => (
          <div key={step.id}>
            <ListItemButton
              component={Link}
              to={`/ref-workflow/step/${step.id}`}
              selected={step.id === currentStepId}
            >
              <ListItemText primary={`Step ${step.id}: ${step.stepTitle}`} />
            </ListItemButton>

            {step.tasks.map((task) => (
              <ListItemButton
                key={task.id}
                component={Link}
                to={`/ref-workflow/step/${step.id}/task/${task.id}`}
                selected={
                  step.id === currentStepId && task.id === currentTaskId
                }
                sx={{ pl: 4 }}
              >
                <ListItemText
                  primary={task.title}
                  secondary={task.status.toUpperCase()}
                />
              </ListItemButton>
            ))}
          </div>
        ))}
      </List>
    </Drawer>
  );
};

export default SidebarNavigation;
