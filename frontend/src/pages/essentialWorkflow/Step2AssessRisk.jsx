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
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [currentTab, setCurrentTab] = useState(0);

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

      {currentTab === 0 && <ImpactAssessment activeTabIndex={currentTab} />}
      {currentTab === 1 && <LikelihoodAssessment activeTabIndex={currentTab} />}
      {currentTab === 2 && <PrioritizedRisk activeTabIndex={currentTab} />}
    </Box>
  );
}

export default Step2AssessRisk;

/* 
  ===========================================
   (A) Impact Assessment
  ===========================================
*/
function ImpactAssessment({ activeTabIndex }) {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState?.step1?.hazards || [];

  const [impactCategories, setImpactCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // 用户选中要打分的系统
  const [selectedSystems, setSelectedSystems] = useState([]);

  // impactRatings: { "hazard::systemName::subName": number }
  const [impactRatings, setImpactRatings] = useState({});

  const [newSystemName, setNewSystemName] = useState('');
  const [selectedSystemForSub, setSelectedSystemForSub] = useState('');
  const [newSubSystemName, setNewSubSystemName] = useState('');

  // 当 activeTabIndex===0 时，才执行 fetch
  useEffect(() => {
    if (activeTabIndex === 0) {
      fetchImpactCategories();
      buildLocalRatingsFromServer();
    }
    // eslint-disable-next-line
  }, [activeTabIndex]);

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
        This step is built based on City of Vancouver's
        {'Resilient Building Planning Worksheet'} <br />
        In this step, you will: <br />
        1) choose systems to be evaluated → <br />
        2) evaluate impact on subsystem from 1~5 <br />
        " For each impact within each Impact Category, assign a consequence
        rating of 1 to 5 based on the suggested scale below. <br />
        Consider both the immediate and long-term impacts of each hazard on each
        impact category. <br />
        Some hazards may cause acute or sudden impacts (""shocks""), while
        others can contribute to chronic impacts (""stressors""). "
        <br />
        1- Very low <br />
        2- Low <br />
        3- Moderate <br />
        4- High <br />
        5- Very High <br />
      </Typography>

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
function LikelihoodAssessment() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  // hazards: 来自 Step1
  const selectedHazards = workflowState?.step1?.hazards || [];
  // 全部FEMA记录: Step1 中保存
  const allFemaRecords = workflowState?.step1?.femaRecords || [];

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

  if (!selectedHazards.length) {
    return (
      <Typography>
        No hazards selected in Step1. Please go back to Step1.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6">Likelihood Assessment</Typography>
      <Typography paragraph>
        For each hazard you selected in Step1, assign a likelihood (1~5).
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

      {/* 显示 IncidentType Frequency 但仅限已选 hazards */}
      <HazardFrequencyChart
        selectedHazards={selectedHazards}
        allFemaRecords={allFemaRecords}
      />

      {/* 显示 FEMA 记录表，但仅限 incidentType 在 selectedHazards 之内 */}
      <HazardRecordsTable
        selectedHazards={selectedHazards}
        allFemaRecords={allFemaRecords}
      />

      {/* Likelihood input */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2, maxWidth: 400, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hazard</TableCell>
                <TableCell>Likelihood (1~5)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedHazards.map((hz) => {
                const val = likelihoodMap[hz] || '';
                return (
                  <TableRow key={hz}>
                    <TableCell>{hz}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={val}
                        onChange={(e) => handleLikelihoodChange(hz, e.target.value)}
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
      </Box>
    </Box>
  );
}

/**
 * (B1) HazardFrequencyChart
 * 绘制 “IncidentType Frequency” 但只针对用户在 Step1 中选的 hazards
 */
function HazardFrequencyChart({ selectedHazards, allFemaRecords }) {
  // 过滤出 incidentType ∈ selectedHazards 的记录
  const filtered = allFemaRecords.filter((rec) =>
    selectedHazards.includes(rec.incidentType)
  );
  // 做频率统计
  const freqMap = {};
  filtered.forEach((rec) => {
    const t = rec.incidentType || 'Unknown';
    freqMap[t] = (freqMap[t] || 0) + 1;
  });
  const chartData = Object.entries(freqMap).map(([type, count]) => ({
    type,
    count,
  }));

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No matching FEMA records for your selected hazards.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        IncidentType Frequency (Selected Hazards Only)
      </Typography>
      <Box sx={{ width: '100%', height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="type" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

/**
 * (B2) HazardRecordsTable
 * 仅显示 incidentType ∈ selectedHazards 的 FEMA记录
 */
function HazardRecordsTable({ selectedHazards, allFemaRecords }) {
  const filtered = allFemaRecords.filter((r) =>
    selectedHazards.includes(r.incidentType)
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Fetched Disaster Records (Selected Hazards Only)
      </Typography>
      {!filtered.length ? (
        <Typography color="text.secondary">
          No FEMA records match your selected hazards.
        </Typography>
      ) : (
        <Paper sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>IncidentType</TableCell>
                <TableCell>BeginDate</TableCell>
                <TableCell>EndDate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((rec, idx) => (
                <TableRow key={idx}>
                  <TableCell>{rec.title}</TableCell>
                  <TableCell>{rec.incidentType}</TableCell>
                  <TableCell>
                    {rec.incidentBeginDate?.slice(0, 10) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {rec.incidentEndDate?.slice(0, 10) || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
/* 
  ===========================================
   (C) Prioritized Risk
   显示时，额外判断“哪些行是 impact>0 && likelihood>0”，只要全部为0则显示 "No data..."
  ===========================================
*/
function PrioritizedRisk({ activeTabIndex }) {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  const [riskResult, setRiskResult] = useState([]);
  const [sortBy, setSortBy] = useState('');

  const [impactCount, setImpactCount] = useState(0);
  const [likelihoodCount, setLikelihoodCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 本地保存已经勾选的
  const [selectedRisks, setSelectedRisks] = useState([]);

  // 当 activeTabIndex===2 或 sortBy 变化时，fetch 最新
  useEffect(() => {
    if (activeTabIndex === 2) {
      fetchAll();
    }
    // eslint-disable-next-line
  }, [activeTabIndex, sortBy]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      // 1) 获取 workflow => 拿到impact / likelihood
      const wfRes = await fetch('http://localhost:8000/workflow');
      if (!wfRes.ok) throw new Error('Error fetching workflow state');
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
      if (!rRes.ok) throw new Error('Error fetching risk data');
      const rData = await rRes.json();
      const rr = rData.riskResult || [];

      setRiskResult(rr);

      // 3) selectedRisks
      const sr = wfData.step2?.selectedRisks || [];
      setSelectedRisks(sr);
    } catch (err) {
      console.error('fetchAll error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function markComplete() {
    try {
      await fetch('http://localhost:8000/workflow/step2/complete', {
        method: 'POST',
      });
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step2.isCompleted = true;
        return updated;
      });
    } catch (err) {
      console.error('Error marking Step2 complete:', err);
    }
  }

  function getRiskColor(score) {
    if (score <= 5) return '#c8e6c9';
    if (score <= 10) return '#dcedc8';
    if (score <= 15) return '#fff9c4';
    if (score <= 20) return '#ffe082';
    return '#ffcdd2';
  }

  // 判断是否被选中
  function isRowSelected(row) {
    return selectedRisks.some(
      (r) =>
        r.hazard === row.hazard &&
        r.systemName === row.systemName &&
        r.subSystemName === row.subSystemName
    );
  }

  async function handleSelectChange(row, checked) {
    try {
      // 调用后端
      await fetch('http://localhost:8000/workflow/step2/select-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazard: row.hazard,
          systemName: row.systemName,
          subSystemName: row.subSystemName,
          selected: checked,
        }),
      });
      // 更新本地
      if (checked) {
        setSelectedRisks((prev) => [...prev, row]);
      } else {
        setSelectedRisks((prev) =>
          prev.filter(
            (r) =>
              !(
                r.hazard === row.hazard &&
                r.systemName === row.systemName &&
                r.subSystemName === row.subSystemName
              )
          )
        );
      }
    } catch (err) {
      console.error('Error setSelectedRisk:', err);
      alert('Failed to update selection. See console.');
    }
  }

  // [MOD] 根据当前 riskResult 里 “impactRating>0 & likelihoodRating>0” 的项目数来判断是否显示表格
  // 如果全是0或者空，就显示“No data or all zeros…”
  const nonZeroRiskRows = riskResult.filter(
    (r) => r.impactRating > 0 && r.likelihoodRating > 0
  );

  // 只要无影响打分 or 无可能打分 or 无非零风险行，就当作“没有数据”
  const showNoData =
    impactCount === 0 || likelihoodCount === 0 || nonZeroRiskRows.length === 0;

  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6">Prioritized Risk</Typography>
      <Typography paragraph>
        If any sub-step is empty, or result is all zeros, we show "No data...".
        You may check the box to select a row for next Step reference.
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
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No data or all zeros. Please fill Impact &amp; Likelihood first.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>Hazard</TableCell>
                <TableCell>System</TableCell>
                <TableCell>SubSystem</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Likelihood</TableCell>
                <TableCell>RiskScore</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nonZeroRiskRows.map((r, idx) => {
                const selected = isRowSelected(r);
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <Checkbox
                        checked={selected}
                        onChange={(e) =>
                          handleSelectChange(r, e.target.checked)
                        }
                      />
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
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
