// src/components/SidebarNavigation.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { WorkflowContext } from '../WorkflowContext';

const drawerWidth = 240;

const SidebarNavigation = ({ currentStepId, currentTaskId }) => {
  const { workflow } = useContext(WorkflowContext);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          // 让它位于 AppBar (64px) 之下
          mt: '64px',
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
            {/* Step行 */}
            <ListItemButton
              component={Link}
              to={`/workflow/step/${step.id}`}
              selected={step.id === currentStepId}
            >
              <ListItemText primary={`Step ${step.id}: ${step.stepTitle}`} />
            </ListItemButton>

            {/* Step 下的 Tasks 列表 */}
            {/* {step.tasks.map((task) => (
              <ListItemButton
                key={task.id}
                component={Link}
                to={`/workflow/step/${step.id}/task/${task.id}`}
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
            ))} */}
          </div>
        ))}
      </List>
    </Drawer>
  );
};

export default SidebarNavigation;
