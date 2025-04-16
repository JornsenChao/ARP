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
  TableContainer,
  TableHead,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [currentTab, setCurrentTab] = useState(0);

  // 当用户点击 "Next Sub Step" => 确认后切换到 nextTab
  const goToNextSubStep = (nextTabIndex) => {
    const confirmed = window.confirm(
      'Are you sure to proceed to the next sub step?'
    );
    if (confirmed) {
      setCurrentTab(nextTabIndex);
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

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 2 }}
      >
        <Tab label="1) Impact Assessment" />
        <Tab label="2) Likelihood" />
        <Tab label="3) Prioritized Risk" />
      </Tabs>

      {/* 使用 hidden 属性而不卸载组件，从而保留本地 state */}
      <Box hidden={currentTab !== 0}>
        <ImpactAssessment onNextSubStep={() => goToNextSubStep(1)} />
      </Box>
      <Box hidden={currentTab !== 1}>
        <LikelihoodAssessment onNextSubStep={() => goToNextSubStep(2)} />
      </Box>
      <Box hidden={currentTab !== 2}>
        {/* 将 currentTab 作为 activeTabIndex 传给第三子组件 */}
        <PrioritizedRisk activeTabIndex={currentTab} />
      </Box>
    </Box>
  );
}

export default Step2AssessRisk;

/* 
  ===========================================
   (A) Impact Assessment
  ===========================================
*/
function ImpactAssessment({ onNextSubStep }) {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState.step1.hazards || [];

  const [impactCategories, setImpactCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // 选中的 system
  const [selectedSystems, setSelectedSystems] = useState([]);

  // impactRatings: { "hazard::systemName::subName": 3, ... }
  const [impactRatings, setImpactRatings] = useState({});

  // For add system/subsystem
  const [newSystemName, setNewSystemName] = useState('');
  const [selectedSystemForSub, setSelectedSystemForSub] = useState('');
  const [newSubSystemName, setNewSubSystemName] = useState('');

  useEffect(() => {
    fetchImpactCategories();
    buildLocalRatingsFromServer();
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

  async function buildLocalRatingsFromServer() {
    try {
      const resp = await fetch('http://localhost:8000/workflow');
      const fullState = await resp.json();
      const arr = fullState?.step2?.impactData || [];
      const newMap = {};
      arr.forEach((item) => {
        const key = buildImpactKey(
          item.hazard,
          item.systemName,
          item.subSystemName
        );
        newMap[key] = item.impactRating;
      });
      setImpactRatings(newMap);
    } catch (err) {
      console.error('Error building local rating map:', err);
    }
  }

  function buildImpactKey(hazard, systemName, subName) {
    return `${hazard}::${systemName}::${subName}`;
  }

  function handleToggleSystem(systemName) {
    setSelectedSystems((prev) => {
      if (prev.includes(systemName)) {
        return prev.filter((s) => s !== systemName);
      } else {
        return [...prev, systemName];
      }
    });
  }

  // 清空 Impact
  async function handleClearImpact() {
    const yes = window.confirm(
      'Clear all Impact Assessment data? This cannot be undone.'
    );
    if (!yes) return;
    try {
      await fetch('http://localhost:8000/workflow/step2/clear-impact', {
        method: 'POST',
      });
      // 清空本地 state
      setImpactRatings({});
    } catch (err) {
      console.error('Error clearing impact data:', err);
    }
  }

  function handleImpactRatingChange(hazard, systemName, subName, inputValue) {
    let val = parseInt(inputValue, 10);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 5) val = 5;
    const key = buildImpactKey(hazard, systemName, subName);
    setImpactRatings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleImpactRatingBlur(hazard, systemName, subName) {
    const key = buildImpactKey(hazard, systemName, subName);
    const rating = impactRatings[key];
    if (!rating) return;
    try {
      await fetch('http://localhost:8000/workflow/step2/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazard,
          systemName,
          subSystemName: subName,
          impactRating: rating,
        }),
      });
    } catch (err) {
      console.error('Error saving impact rating:', err);
    }
  }

  function getImpactBgColor(r) {
    switch (r) {
      case 1:
        return '#c8e6c9';
      case 2:
        return '#dcedc8';
      case 3:
        return '#ffecb3';
      case 4:
        return '#ffd54f';
      case 5:
        return '#ffcdd2';
      default:
        return 'transparent';
    }
  }

  // Add System
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

  // Add SubSystem
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

  if (!hazards.length) {
    return <Typography>No hazards found. Please go back to Step1.</Typography>;
  }
  if (loadingCats) {
    return <Typography>Loading system & subSystem data...</Typography>;
  }

  const filteredCategories = impactCategories.filter((sys) =>
    selectedSystems.includes(sys.systemName)
  );

  return (
    <Box>
      <Typography variant="h6">High Level Impact Assessment</Typography>
      <Typography paragraph>
        1) Select systems. 2) Enter 1-5 impact rating.
      </Typography>

      {/* Clear按钮 */}
      <Box sx={{ mb: 1 }}>
        <Button variant="outlined" color="error" onClick={handleClearImpact}>
          Clear Current Input
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {impactCategories.map((sys) => (
          <FormControlLabel
            key={sys.systemName}
            control={
              <Checkbox
                checked={selectedSystems.includes(sys.systemName)}
                onChange={() => handleToggleSystem(sys.systemName)}
              />
            }
            label={sys.systemName}
          />
        ))}
      </Box>

      {filteredCategories.length === 0 ? (
        <Typography color="text.secondary">No systems selected yet.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
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
              {filteredCategories.map((sys) => (
                <SystemRow
                  key={sys.systemName}
                  systemData={sys}
                  hazards={hazards}
                  impactRatings={impactRatings}
                  onRatingChange={handleImpactRatingChange}
                  onRatingBlur={handleImpactRatingBlur}
                  getImpactBgColor={getImpactBgColor}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add System/Subsystem */}
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

      {/* Next Sub Step */}
      <Button variant="contained" onClick={onNextSubStep}>
        Next Sub Step
      </Button>
    </Box>
  );
}

function SystemRow({
  systemData,
  hazards,
  impactRatings,
  onRatingChange,
  onRatingBlur,
  getImpactBgColor,
}) {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(!open);

  return (
    <>
      <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
        <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          <IconButton size="small" onClick={toggleOpen}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          {systemData.systemName}
        </TableCell>
        {hazards.map((hz) => (
          <TableCell key={hz} align="center">
            —
          </TableCell>
        ))}
      </TableRow>

      {open &&
        systemData.subSystems?.map((sub) => (
          <TableRow key={sub.name}>
            <TableCell sx={{ pl: 6 }}>{sub.name}</TableCell>
            {hazards.map((hz) => {
              const key = `${hz}::${systemData.systemName}::${sub.name}`;
              const val = impactRatings[key] || '';
              return (
                <TableCell key={hz} align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={val}
                    onChange={(e) =>
                      onRatingChange(
                        hz,
                        systemData.systemName,
                        sub.name,
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      onRatingBlur(hz, systemData.systemName, sub.name)
                    }
                    sx={{
                      width: 60,
                      backgroundColor: val
                        ? getImpactBgColor(parseInt(val))
                        : 'transparent',
                    }}
                    inputProps={{ min: 1, max: 5 }}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
    </>
  );
}

/* 
  ===========================================
   (B) Likelihood Assessment
  ===========================================
*/
function LikelihoodAssessment({ onNextSubStep }) {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState.step1.hazards || [];

  const [likelihoodMap, setLikelihoodMap] = useState({});

  useEffect(() => {
    buildLocalLikelihoodFromServer();
  }, []);

  async function buildLocalLikelihoodFromServer() {
    try {
      const res = await fetch('http://localhost:8000/workflow');
      const fullState = await res.json();
      const arr = fullState?.step2?.likelihoodData || [];
      const tempMap = {};
      arr.forEach((item) => {
        tempMap[item.hazard] = item.likelihoodRating;
      });
      setLikelihoodMap(tempMap);
    } catch (err) {
      console.error('Error fetching likelihood data:', err);
    }
  }

  async function handleClearLikelihood() {
    const yes = window.confirm('Clear all Likelihood Assessment data?');
    if (!yes) return;
    try {
      await fetch('http://localhost:8000/workflow/step2/clear-likelihood', {
        method: 'POST',
      });
      // 本地清空
      setLikelihoodMap({});
    } catch (err) {
      console.error('Error clearing likelihood data:', err);
    }
  }

  function handleLikelihoodChange(hazard, valStr) {
    let val = parseInt(valStr, 10);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 5) val = 5;
    setLikelihoodMap((prev) => ({ ...prev, [hazard]: val }));
  }

  async function handleLikelihoodBlur(hazard) {
    const rating = likelihoodMap[hazard] || 1;
    try {
      await fetch('http://localhost:8000/workflow/step2/likelihood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazard,
          likelihoodRating: rating,
        }),
      });
    } catch (err) {
      console.error('Error saving likelihood:', err);
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

      {/* Clear按钮 */}
      <Box sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearLikelihood}
        >
          Clear Current Input
        </Button>
      </Box>

      <Paper sx={{ p: 2, maxWidth: 400, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hazard</TableCell>
              <TableCell>Likelihood (1~5)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hazards.map((hz) => {
              const val = likelihoodMap[hz] || '';
              return (
                <TableRow key={hz}>
                  <TableCell>{hz}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={val}
                      onChange={(e) =>
                        handleLikelihoodChange(hz, e.target.value)
                      }
                      onBlur={() => handleLikelihoodBlur(hz)}
                      sx={{ width: 60 }}
                      inputProps={{ min: 1, max: 5 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Button variant="contained" onClick={onNextSubStep}>
        Next Sub Step
      </Button>
    </Box>
  );
}

/* 
  ===========================================
   (C) Prioritized Risk
   =  => auto "internal refresh" whenever 
   =     user enters sub step #3
  ===========================================
*/
function PrioritizedRisk({ activeTabIndex }) {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  // riskResult
  const [riskResult, setRiskResult] = useState([]);
  // track length of impactData / likelihoodData
  const [impactCount, setImpactCount] = useState(0);
  const [likelihoodCount, setLikelihoodCount] = useState(0);

  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // whenever "activeTabIndex===2" or sortBy changes, fetch data
  useEffect(() => {
    if (activeTabIndex === 2) {
      fetchAll();
    }
  }, [activeTabIndex, sortBy]);

  async function fetchAll() {
    setLoading(true);
    setError(null);

    try {
      // 1) 获取 workflow => 检查 impact/likelihood
      const wfRes = await fetch('http://localhost:8000/workflow');
      if (!wfRes.ok) {
        throw new Error(`Error fetching workflow: ${wfRes.status}`);
      }
      const wfData = await wfRes.json();
      const impactArr = wfData.step2?.impactData || [];
      const likelihoodArr = wfData.step2?.likelihoodData || [];
      setImpactCount(impactArr.length);
      setLikelihoodCount(likelihoodArr.length);

      // 2) 获取 risk
      let url = 'http://localhost:8000/workflow/step2/risk';
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
      }
      const rRes = await fetch(url);
      if (!rRes.ok) {
        throw new Error(`Error fetching risk data: ${rRes.status}`);
      }
      const rData = await rRes.json();
      const rr = rData.riskResult || [];

      setRiskResult(rr);
    } catch (err) {
      console.error('fetchAll error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(score) {
    if (score <= 5) return '#c8e6c9';
    if (score <= 10) return '#dcedc8';
    if (score <= 15) return '#fff9c4';
    if (score <= 20) return '#ffe082';
    return '#ffcdd2';
  }

  async function markComplete() {
    try {
      const res = await fetch('http://localhost:8000/workflow/step2/complete', {
        method: 'POST',
      });
      const data = await res.json();
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step2.isCompleted = true;
        return updated;
      });
    } catch (err) {
      console.error('Error marking Step2 complete:', err);
    }
  }

  // ============== Render ==============
  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // 如果 impactCount=0 or likelihoodCount=0 or riskResult=0 => "No data"
  const showNoData =
    impactCount === 0 || likelihoodCount === 0 || riskResult.length === 0;

  return (
    <Box>
      <Typography variant="h6">Prioritized Risk</Typography>
      <Typography paragraph>
        If any sub-step is empty, or result is zero, we show "No data".
      </Typography>

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

      {showNoData ? (
        <Typography color="text.secondary">
          No data or all zeros. Please fill Impact &amp; Likelihood first.
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
                  <TableCell
                    sx={{
                      backgroundColor: getRiskColor(r.riskScore),
                      fontWeight: 'bold',
                    }}
                  >
                    {r.riskScore}
                  </TableCell>
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
          Next: Step 3
        </Button>
      </Box>
    </Box>
  );
}
