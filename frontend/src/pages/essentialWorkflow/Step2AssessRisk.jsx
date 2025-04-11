// src/pages/Step2AssessRisk.jsx
import React, { useContext, useState } from 'react';
import { Box, Tabs, Tab, Typography, Button, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step2AssessRisk() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );
  const [currentTab, setCurrentTab] = useState(0);

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step 2...</Box>;
  }

  const { step2 } = workflowState;
  const selectedHazards = workflowState.step1.hazards || [];

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 示例：手动标记 step2.isCompleted = true, 仅当完成risk
  function completeRiskAndEnableNext() {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step2.isCompleted = true;
      return updated;
    });
  }

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 2: Assess Risk
      </Typography>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Impact & Consequence" />
        <Tab label="Likelihood and Risk Assessment" />
        <Tab label="Prioritized Risks" />
      </Tabs>

      {/* 三个子页面 */}
      {currentTab === 0 && (
        <Box>
          <Typography variant="h6">
            Impact Assessment & Consequence Rating
          </Typography>
          <Typography>
            Hazards identified in Step1: {selectedHazards.join(', ') || 'None'}
          </Typography>
          <Typography>
            High Level Impact Assessment & Consequence Rating
          </Typography>
        </Box>
      )}
      {currentTab === 1 && (
        <Box>
          <Typography variant="h6">Likelihood and Risk Assessment</Typography>
          <Typography>Likelihood and Risk Assessment...</Typography>
        </Box>
      )}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h6">Comfirm Prioritized Risks</Typography>
          <Typography>Comfirm Prioritized Risks</Typography>
          <Button
            variant="contained"
            onClick={completeRiskAndEnableNext}
            sx={{ mt: 2 }}
          >
            Mark Risk as Done
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          component={Link}
          to="/workflow/step3"
          disabled={!step2.isCompleted} // 只有当Risk子步骤完成后才可点击
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
}

export default Step2AssessRisk;
