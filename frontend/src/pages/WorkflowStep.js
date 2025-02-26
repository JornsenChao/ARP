// src/pages/WorkflowStep.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Paper,
} from '@mui/material';

import workflowData from '../WorkflowData';
import WorkflowTaskModal from './WorkflowTaskModal';
import ResrcPrecNotesLibrary from '../components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary';
import SidebarNavigation from '../components/SidebarNavigation';

const WorkflowStep = () => {
  const { stepId } = useParams();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();
  const stepNum = parseInt(stepId, 10);
  const step = workflowData.find((s) => s.id === stepNum);

  if (!step) {
    return (
      <Typography variant="h6" sx={{ m: 2 }}>
        Step not found.
      </Typography>
    );
  }

  // 当前 step 在 workflowData 中的索引
  const totalSteps = workflowData.length;
  const currentIndex = workflowData.findIndex((s) => s.id === stepNum);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === totalSteps - 1;

  const handlePrevStep = () => {
    if (!isFirstStep) {
      const prevStepId = workflowData[currentIndex - 1].id;
      navigate(`/workflow/step/${prevStepId}`);
    }
  };

  const handleNextStep = () => {
    if (!isLastStep) {
      const nextStepId = workflowData[currentIndex + 1].id;
      navigate(`/workflow/step/${nextStepId}`);
    }
  };

  const handleSeeDetails = (task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTask(null);
  };

  const handleStartTask = (taskId) => {
    navigate(`/workflow/step/${stepId}/task/${taskId}`);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 左侧永久抽屉 */}
      <SidebarNavigation currentStepId={stepNum} currentTaskId={null} />

      {/* 右侧主内容区域 */}

      <Box sx={{ flex: 1, p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Step {step.id}: {step.stepTitle}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Deliverable:</strong> {step.deliverable}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Tasks
          </Typography>

          {/* 用 Paper 包一下，让列表更有分隔感 */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="column" spacing={2} sx={{ flexWrap: 'wrap' }}>
              {step.tasks.map((task) => (
                <Card key={task.id} sx={{ width: 300 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {task.title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={() => handleSeeDetails(task)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleStartTask(task.id)}
                      >
                        Start
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Resources, Precedents, and Notes</Typography>
          <Paper sx={{ p: 2 }}>
            <Button variant="contained" onClick={() => setLibraryOpen(true)}>
              Open Resource & Precedent Library
            </Button>
          </Paper>
        </Box>

        {/* 抽屉面板 */}
        <ResrcPrecNotesLibrary
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
        />

        {/* 任务详情Modal */}
        {modalOpen && selectedTask && (
          <WorkflowTaskModal task={selectedTask} onClose={handleCloseModal} />
        )}

        {/* 上一步 / 下一步 */}
        <Box sx={{ mt: 2 }}>
          {!isFirstStep && (
            <Button variant="outlined" onClick={handlePrevStep} sx={{ mr: 1 }}>
              Previous Step
            </Button>
          )}
          {!isLastStep && (
            <Button variant="outlined" onClick={handleNextStep}>
              Next Step
            </Button>
          )}
          <Button component={Link} to="/workflow" variant="outlined">
            Back to Workflow Home
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkflowStep;
