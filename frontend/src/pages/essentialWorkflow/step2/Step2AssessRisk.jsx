// src/pages/essentialWorkflow/Step2AssessRisk.jsx

import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Tabs,
  Tab,
  Button,
  Paper,
  Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';
import StepProgressBar from '../StepProgressBar';
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
  const [guideExpanded, setGuideExpanded] = useState(false);
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
    return (
      <Box
        sx={{
          flex: 1,
          borderRight: '1px solid #ccc',
          height: '100vh',
          overflowY: 'auto',
          p: 2,
          mt: 2,
        }}
      >
        Loading Step 2...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        borderRight: '1px solid #ccc',
        height: '100vh',
        overflowY: 'auto',
        p: 2,
        mt: 2,
      }}
    >
      <Toolbar />
      <StepProgressBar />
      <Typography variant="h4" gutterBottom>
        Step 2: Assess Risk
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setGuideExpanded(!guideExpanded)}
        >
          <Typography variant="h6">Guidance & Explanation</Typography>
          {guideExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>
        <Collapse in={guideExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              <strong>Step2: Risk Assessment</strong> helps you quantify the
              hazards chosen in Step1. This process is split into:
              <ol>
                <li>
                  <em>Impact</em>: Rate each system&apos;s vulnerability on a
                  scale of 1 (very low) to 5 (very high).
                </li>
                <li>
                  <em>Likelihood</em>: Estimate how probable each hazard is,
                  again scored 1–5 or via a Bayesian approach.
                </li>
                <li>
                  <em>Prioritized Risk</em>: Combine Impact &amp; Likelihood to
                  get a risk score. Then select the highest concerns for the
                  next step.
                </li>
              </ol>
            </Typography>
          </Box>
        </Collapse>
      </Paper>
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
