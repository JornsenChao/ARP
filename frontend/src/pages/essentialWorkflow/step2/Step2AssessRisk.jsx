// src/pages/essentialWorkflow/Step2AssessRisk.jsx

import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Box, Typography, Toolbar, Tabs, Tab, Button } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';

import ImpactAssessment from './ImpactAssessment';
import LikelihoodAssessment from './LikelihoodAssessment';
import PrioritizedRisk from './PrioritizedRisk';

/**
 * Step2AssessRisk - the main container for Step2
 * which includes 3 sub steps (Impact, Likelihood, PrioritizedRisk)
 */
function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (e, val) => {
    setCurrentTab(val);
  };

  // 当用户点击 "Next Task" (在 Tab 内部跳转)
  const handleNextTaskClick = () => {
    if (currentTab < 2) {
      setCurrentTab(currentTab + 1);
    }
  };
  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step 2...</Box>;
  }

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 2: Assess Risk
      </Typography>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="1) Impact Assessment" />
        <Tab label="2) Likelihood" />
        <Tab label="3) Prioritized Risk" />
      </Tabs>

      {currentTab === 0 && <ImpactAssessment activeTabIndex={currentTab} />}
      {currentTab === 1 && <LikelihoodAssessment activeTabIndex={currentTab} />}
      {currentTab === 2 && <PrioritizedRisk activeTabIndex={currentTab} />}

      <Box sx={{ mt: 2 }}>
        {currentTab < 2 ? (
          <Button variant="contained" onClick={handleNextTaskClick}>
            Next Task (within Step2)
          </Button>
        ) : (
          <Button variant="contained" component={Link} to="/workflow/step3">
            Next Step (Step3)
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default Step2AssessRisk;
