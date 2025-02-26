// src/components/SidebarNavigation.js
import React from 'react';
import { Link } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/system';
import workflowData from '../WorkflowData';

// 固定宽度的 Drawer
const drawerWidth = 240;

// 自定义一个容器，用于包裹 <Drawer> 内部内容
const DrawerHeader = styled('div')(({ theme }) => ({
  ...theme.mixins.toolbar,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(2),
}));

const SidebarNavigation = ({ currentStepId, currentTaskId }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: '64px',
        },
      }}
    >
      <DrawerHeader>
        <Typography variant="h6">Workflow Steps</Typography>
      </DrawerHeader>

      <List>
        {workflowData.map((step) => (
          <div key={step.id}>
            <ListItemButton
              component={Link}
              to={`/workflow/step/${step.id}`}
              selected={step.id === currentStepId}
            >
              <ListItemText
                primary={`Step ${step.id}: ${step.stepTitle}`}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>

            {/* 如果 step 有 tasks */}
            {step.tasks &&
              step.tasks.map((task) => (
                <ListItemButton
                  key={task.id}
                  sx={{ pl: 4 }} // 缩进让层次分明
                  component={Link}
                  to={`/workflow/step/${step.id}/task/${task.id}`}
                  selected={
                    step.id === currentStepId && task.id === currentTaskId
                  }
                >
                  <ListItemText
                    primary={task.title}
                    primaryTypographyProps={{ noWrap: true }}
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
