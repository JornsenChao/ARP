// src/pages/essentialWorkflow/EssentialWorkflowHome.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Typography,
  Paper,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function EssentialWorkflowHome() {
  return (
    <Box
      component="main"
      sx={{
        mt: 8, // 避免被固定navbar遮住，如果你的NavBar不是fixed可按需调整
        px: 3,
        py: 2,
      }}
    >
      <Toolbar />
      {/* ========== 1) 标题 & 简要Hero ========== */}
      <Paper
        variant="outlined"
        sx={{ p: 3, borderRadius: 2, mb: 3, textAlign: 'center' }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to the Essential Resilience Workflow
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          A four-step process to identify hazards, assess risk, explore
          resilience strategies, and finalize your project’s summary.
        </Typography>

        {/* 下面是一个主按钮，可以是 Start / Resume */}
        {/* 如果你有上下文判断,可切换button的文案：Start new / Resume Step X */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          component={Link}
          to="/workflow/step1"
        >
          Start the Workflow
        </Button>
      </Paper>

      {/* ========== 2) 详细介绍（可折叠） ========== */}
      <Accordion defaultExpanded={false} sx={{ mb: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">More About This Workflow</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            This workflow is designed to guide you through a structured approach
            to resilience research. Each step focuses on a major milestone:
            identifying local hazards, assessing risk levels, discovering
            strategies or resources, and finally summarizing your findings.
          </Typography>
          <Typography variant="body2" paragraph>
            You can move through each step in order or jump ahead if you already
            know what you need. The platform saves your selections, so you can
            always revisit and refine any step at any time.
          </Typography>
          <Typography variant="body2">
            Below, you’ll find quick cards for each step if you prefer to jump
            directly. Otherwise, just click the “Start the Workflow” button
            above to begin from Step 1.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* ========== 3) 4 个 Step 概览卡片 ========== */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Access to Each Step
      </Typography>
      <Grid container spacing={2}>
        {/* Step 1 Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardActionArea component={Link} to="/workflow/step1">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Step 1: Identify Hazard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gather hazard data for your project location. Filter by date,
                  and choose which hazards you want to address.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button component={Link} to="/workflow/step1" size="small">
                Go
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Step 2 Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardActionArea component={Link} to="/workflow/step2">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Step 2: Assess Risk
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rate impact and likelihood to create a prioritized risk
                  matrix, focusing on what matters most.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button component={Link} to="/workflow/step2" size="small">
                Go
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Step 3 Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardActionArea component={Link} to="/workflow/step3">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Step 3: Explore Resources
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover relevant case studies, strategies, and external
                  resources to address your prioritized hazards.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button component={Link} to="/workflow/step3" size="small">
                Go
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Step 4 Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardActionArea component={Link} to="/workflow/step4">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Step 4: Finalize & Export
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and summarize your entire resilience plan. Export or
                  submit the final documentation.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button component={Link} to="/workflow/step4" size="small">
                Go
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* ========== 4) 也可再做个小分割线/说明 ========== */}
      <Divider sx={{ mt: 4, mb: 2 }} />
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Unsure where to start? No worries—click “Start the Workflow” above to
          follow the recommended path.
        </Typography>
      </Stack>
    </Box>
  );
}

export default EssentialWorkflowHome;
