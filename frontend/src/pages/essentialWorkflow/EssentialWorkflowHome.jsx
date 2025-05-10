// src/pages/essentialWorkflow/EssentialWorkflowHome.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Toolbar, Paper, Stack } from '@mui/material';

/**
 * Essential Workflow 首页：提供简要介绍 + 4个步骤入口
 */
function EssentialWorkflowHome() {
  return (
    <Box
      component="main"
      sx={{
        // mt: 8 通常用于避免被固定Navbar遮挡，可按实际情况调整
        mt: 8,
        px: 3,
        py: 2,
      }}
    >
      {/* 如果您的 NavBar是fixed，可以用 Toolbar 占位 */}
      <Toolbar />

      <Typography variant="h4" gutterBottom>
        Essential Workflow Home
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This is the new 4-step resilience workflow. Please proceed step by step.
      </Typography>

      {/* 这里我们用Paper包裹，让内容区域更聚焦 */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          // 无需明显阴影，使用outlined或轻微阴影更简洁
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Quick Navigation
        </Typography>
        <Typography variant="body2" paragraph>
          Select a step to begin or continue your resilience study.
        </Typography>

        {/* 按钮组 */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            component={Link}
            to="/workflow/step1"
            disableElevation
          >
            Step 1
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/workflow/step2"
            disableElevation
          >
            Step 2
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/workflow/step3"
            disableElevation
          >
            Step 3
          </Button>
          <Button
            variant="outlined"
            component={Link}
            to="/workflow/step4"
            disableElevation
          >
            Step 4
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default EssentialWorkflowHome;
