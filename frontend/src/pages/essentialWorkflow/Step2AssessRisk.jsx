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
  TableContainer,
  TableHead,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
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
  const hazards = workflowState.step1.hazards || [];

  // impactCategories: [ { systemName, subSystems: [{name},...] } ]
  const [impactCategories, setImpactCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // For "Add System"
  const [newSystemName, setNewSystemName] = useState('');
  // For "Add Subsystem"
  const [selectedSystemForSub, setSelectedSystemForSub] = useState('');
  const [newSubSystemName, setNewSubSystemName] = useState('');

  // =========== Fetch system-subSystem data ============
  useEffect(() => {
    fetchImpactCategories();
    // eslint-disable-next-line
  }, []);

  async function fetchImpactCategories() {
    setLoadingCats(true);
    try {
      const res = await fetch(
        'http://localhost:8000/workflow/step2/impact-categories'
      );
      const data = await res.json();
      if (Array.isArray(data.impactCategories)) {
        setImpactCategories(data.impactCategories);
      } else {
        setImpactCategories([]);
      }
    } catch (err) {
      console.error('Error fetching impact-categories:', err);
      setImpactCategories([]);
    } finally {
      setLoadingCats(false);
    }
  }

  // =========== Add System & SubSystem ============
  async function handleAddSystem() {
    if (!newSystemName.trim()) return;
    try {
      const res = await fetch(
        'http://localhost:8000/workflow/step2/add-system',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemName: newSystemName }),
        }
      );
      if (!res.ok) {
        const errMsg = await res.json();
        alert(errMsg.detail || 'Add system error');
      } else {
        const data = await res.json();
        setImpactCategories(data.impactCategories);
        setNewSystemName('');
      }
    } catch (err) {
      console.error('Error adding system:', err);
    }
  }

  async function handleAddSubSystem() {
    if (!selectedSystemForSub || !newSubSystemName.trim()) return;
    try {
      const res = await fetch(
        'http://localhost:8000/workflow/step2/add-subsystem',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemName: selectedSystemForSub,
            subSystemName: newSubSystemName,
          }),
        }
      );
      if (!res.ok) {
        const errMsg = await res.json();
        alert(errMsg.detail || 'Add subsystem error');
      } else {
        const data = await res.json();
        setImpactCategories(data.impactCategories);
        setSelectedSystemForSub('');
        setNewSubSystemName('');
      }
    } catch (err) {
      console.error('Error adding subSystem:', err);
    }
  }

  // =========== Save Impact rating ============
  async function saveImpact(hazard, systemName, subSystemName, rating) {
    const impactRating = parseInt(rating, 10) || 0;
    try {
      await fetch('http://localhost:8000/workflow/step2/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazard,
          systemName,
          subSystemName,
          impactRating,
        }),
      });
    } catch (err) {
      console.error('Error saving impact rating:', err);
    }
  }

  // =========== UI Rendering =============
  if (!hazards.length) {
    return (
      <Typography>
        No hazards found. Please go back to Step1 and select some hazards.
      </Typography>
    );
  }
  if (loadingCats) {
    return <Typography>Loading system & subSystem data...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6">High Level Impact Assessment</Typography>
      <Typography paragraph>
        For each Hazard × (System → SubSystem), assign an Impact Rating (1~5).
        <br />
        Click the arrow to expand or hide subSystems.
      </Typography>

      {/* Add System */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add New System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="System Name"
            size="small"
            value={newSystemName}
            onChange={(e) => setNewSystemName(e.target.value)}
            sx={{ width: 200 }}
          />
          <Button variant="contained" onClick={handleAddSystem}>
            ADD SYSTEM
          </Button>
        </Box>
      </Paper>

      {/* Add SubSystem */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add New SubSystem
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel>System</InputLabel>
            <Select
              label="System"
              value={selectedSystemForSub}
              onChange={(e) => setSelectedSystemForSub(e.target.value)}
            >
              {impactCategories.map((sys) => (
                <MenuItem key={sys.systemName} value={sys.systemName}>
                  {sys.systemName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="SubSystem Name"
            size="small"
            value={newSubSystemName}
            onChange={(e) => setNewSubSystemName(e.target.value)}
            sx={{ width: 200 }}
          />

          <Button variant="contained" onClick={handleAddSubSystem}>
            ADD SUBSYSTEM
          </Button>
        </Box>
      </Paper>

      {/* Single table with hazards as columns */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%' }}>System / SubSystem</TableCell>
              {hazards.map((hz) => (
                <TableCell key={hz} align="center">
                  {hz}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {impactCategories.map((sys) => (
              <SystemRow
                key={sys.systemName}
                systemData={sys}
                hazards={hazards}
                onSaveImpact={saveImpact}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/**
 * Renders one "system" row + optional "subSystem" rows
 * in the same table, ensuring column alignment
 */
function SystemRow({ systemData, hazards, onSaveImpact }) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <>
      {/* The "System" row */}
      <TableRow
        sx={{
          backgroundColor: '#f9f9f9',
        }}
      >
        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          <IconButton size="small" onClick={toggleOpen}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          {systemData.systemName}
        </TableCell>
        {/* If you want to display aggregated info for each hazard, do so here; otherwise just use a dash */}
        {hazards.map((hz) => (
          <TableCell key={hz} align="center">
            —
          </TableCell>
        ))}
      </TableRow>

      {/* Conditionally render subSystem rows below, to keep columns aligned */}
      {open &&
        systemData.subSystems &&
        systemData.subSystems.map((sub) => (
          <TableRow key={sub.name}>
            <TableCell sx={{ pl: 6 }}>{sub.name}</TableCell>
            {hazards.map((hz) => (
              <TableCell key={hz} align="center">
                <TextField
                  type="number"
                  size="small"
                  InputProps={{ inputProps: { min: 1, max: 5 } }}
                  onBlur={(e) =>
                    onSaveImpact(
                      hz,
                      systemData.systemName,
                      sub.name,
                      e.target.value
                    )
                  }
                  sx={{ width: 60 }}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
    </>
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
      await fetch('http://localhost:8000/workflow/step2/likelihood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazard, likelihoodRating }),
      });
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
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    fetchRisk();
    // eslint-disable-next-line
  }, [sortBy]);

  async function fetchRisk() {
    try {
      let url = 'http://localhost:8000/workflow/step2/risk';
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
      }
      const res = await fetch(url);
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
        Risk = Impact × Likelihood. You can choose a sorting method below.
      </Typography>

      {/* 选择排序方式 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="">(No Sort)</MenuItem>
            <MenuItem value="system">System Name</MenuItem>
            <MenuItem value="hazard">Hazard</MenuItem>
            <MenuItem value="score">Risk Score Desc</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
                <TableCell>SubSystem</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Likelihood</TableCell>
                <TableCell>RiskScore</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskResult.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.hazard}</TableCell>
                  <TableCell>{r.systemName}</TableCell>
                  <TableCell>{r.subSystemName}</TableCell>
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
