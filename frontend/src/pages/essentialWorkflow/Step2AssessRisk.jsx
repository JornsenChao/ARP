// src/pages/essentialWorkflow/Step2AssessRisk.jsx
import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from '@mui/material';
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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 2: Assess Risk
      </Typography>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="1) Impact Assessment" />
        <Tab label="2) Likelihood Assessment" />
        <Tab label="3) Prioritized Risk" />
      </Tabs>

      {currentTab === 0 && <ImpactAssessment />}
      {currentTab === 1 && <LikelihoodAssessment />}
      {currentTab === 2 && <PrioritizedRisk />}
    </Box>
  );
}

export default Step2AssessRisk;

/* 
  ---------------------------
   (A) Impact Assessment Tab
  ---------------------------
*/
function ImpactAssessment() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [impactData, setImpactData] = useState([]);

  const hazards = workflowState.step1.hazards || [];

  // 1. 拉取 system categories, step2.impactData 不一定要拉接口，
  //    这里演示直接把 "saved" 结果发后端就行
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch(
        'http://localhost:8000/workflow/step2/categories'
      );
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  // 2. “Add System” => POST /workflow/step2/categories
  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    try {
      await fetch('http://localhost:8000/workflow/step2/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName: newCategory }),
      });
      setNewCategory('');
      fetchCategories(); // 刷新列表
    } catch (err) {
      console.error('Error adding category:', err);
    }
  }

  // 3. impactRating 改变 => 调用 setImpactRating
  async function saveImpact(hazard, system, rating) {
    // rating 在这里是字符串 => 转数字
    const impactRating = parseInt(rating, 10) || 0;
    try {
      const res = await fetch('http://localhost:8000/workflow/step2/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazard, system, impactRating }),
      });
      const data = await res.json();
      console.log('Saved impact rating:', data);
    } catch (err) {
      console.error('Error saving impact rating:', err);
    }
  }

  if (!hazards.length) {
    return <Typography>No hazards found. Please go back to Step1.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6">High Level Impact Assessment</Typography>
      <Typography paragraph>
        For each Hazard × System, assign an Impact Rating (1~5).
      </Typography>

      {/* Add new system */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Add new system..."
          size="small"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          sx={{ mr: 1 }}
        />
        <Button variant="contained" onClick={handleAddCategory}>
          Add System
        </Button>
      </Box>

      {/* Table: hazards × categories */}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>System / Hazard</TableCell>
              {hazards.map((hz) => (
                <TableCell key={hz}>{hz}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((system) => (
              <TableRow key={system}>
                <TableCell>{system}</TableCell>
                {hazards.map((hz) => (
                  <TableCell key={hz}>
                    <TextField
                      type="number"
                      size="small"
                      InputProps={{ inputProps: { min: 1, max: 5 } }}
                      onBlur={(e) => saveImpact(hz, system, e.target.value)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

/* 
  ---------------------------
   (B) Likelihood Assessment 
  ---------------------------
*/
function LikelihoodAssessment() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState.step1.hazards || [];

  async function saveLikelihood(hazard, rating) {
    const likelihoodRating = parseInt(rating, 10) || 0;
    try {
      const res = await fetch(
        'http://localhost:8000/workflow/step2/likelihood',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hazard, likelihoodRating }),
        }
      );
      const data = await res.json();
      console.log('Saved likelihood rating:', data);
    } catch (err) {
      console.error('Error saving likelihood rating:', err);
    }
  }

  if (!hazards.length) {
    return <Typography>No hazards found. Please go back to Step1.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6">Likelihood Assessment</Typography>
      <Typography paragraph>
        Assign a likelihood (1~5) for each hazard's chance of occurrence.
      </Typography>

      <Paper sx={{ p: 2, maxWidth: 400 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hazard</TableCell>
              <TableCell>Likelihood (1~5)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hazards.map((hz) => (
              <TableRow key={hz}>
                <TableCell>{hz}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    InputProps={{ inputProps: { min: 1, max: 5 } }}
                    onBlur={(e) => saveLikelihood(hz, e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

/* 
  ---------------------------
   (C) Prioritized Risk 
  ---------------------------
*/
function PrioritizedRisk() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );
  const [riskResult, setRiskResult] = useState([]);

  useEffect(() => {
    fetchRisk();
  }, []);

  async function fetchRisk() {
    try {
      const res = await fetch('http://localhost:8000/workflow/step2/risk');
      const data = await res.json();
      if (data.riskResult) {
        setRiskResult(data.riskResult);
      }
    } catch (err) {
      console.error('Error calculating risk:', err);
    }
  }

  async function markComplete() {
    try {
      const res = await fetch('http://localhost:8000/workflow/step2/complete', {
        method: 'POST',
      });
      const data = await res.json();
      console.log('Step2 completed', data);
      // 也可以更新本地 state
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step2.isCompleted = true;
        return updated;
      });
    } catch (err) {
      console.error('Error marking Step2 complete:', err);
    }
  }

  return (
    <Box>
      <Typography variant="h6">Prioritized Risk</Typography>
      <Typography paragraph>
        Risk = Impact × Likelihood. Highest risk first.
      </Typography>

      {riskResult.length === 0 ? (
        <Typography>
          No data or all zeros. Please fill Impact & Likelihood first.
        </Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hazard</TableCell>
                <TableCell>System</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Likelihood</TableCell>
                <TableCell>RiskScore</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskResult.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.hazard}</TableCell>
                  <TableCell>{r.system}</TableCell>
                  <TableCell>{r.impactRating}</TableCell>
                  <TableCell>{r.likelihoodRating}</TableCell>
                  <TableCell>{r.riskScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={markComplete}>
          Mark Step2 as Complete
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="text" component={Link} to="/workflow/step3">
          Next Step
        </Button>
      </Box>
    </Box>
  );
}
