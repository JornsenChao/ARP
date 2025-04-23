// src/pages/essentialWorkflow/Step2AssessRisk.jsx

import React, { useContext, useState, useEffect, useMemo } from 'react';
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
  Radio,
  RadioGroup,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from 'recharts';

function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [currentTab, setCurrentTab] = useState(0);
  const handleNextTaskClick = () => {
    // 这里可以做：若 currentTab < 2, 就 setCurrentTab(currentTab + 1);
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
   重点：增加“Yearly BarChart” + “Focus Hazards” + “Aggregate by Decade”
  ===========================================
*/
const LikelihoodAssessment = () => {
  const { workflowState } = useContext(EssentialWorkflowContext);

  // 1) 从 Step1 获取用户选中的 hazards + FEMA记录
  const selectedHazards = workflowState?.step1?.hazards || [];
  const allFemaRecords = workflowState?.step1?.femaRecords || [];

  // 2) Step2 Likelihood Data
  const [likelihoodMap, setLikelihoodMap] = useState({});

  // 3) 额外：Chart aggregator: "year" / "decade"
  const [aggregator, setAggregator] = useState('year');
  // 4) Focus hazards：如果用户想只看部分 hazards
  //   如果 userFocusHazards.length===0 表示显示全部 selectedHazards
  const [userFocusHazards, setUserFocusHazards] = useState([]);

  useEffect(() => {
    buildLocalLikelihoodFromServer();
  }, []);

  // 拉取后端 step2.likelihoodData => 存到 local state
  const buildLocalLikelihoodFromServer = async () => {
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
  };

  const handleClearLikelihood = async () => {
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
  };

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

  if (selectedHazards.length === 0) {
    return (
      <Typography sx={{ mt: 2 }}>
        No hazards selected in Step1. Please go back to Step1.
      </Typography>
    );
  }

  // =========== 生成 grouped-bar-chart 数据 ==============
  // aggregator: "year" or "decade"
  // userFocusHazards: 如果空 => 用 selectedHazards；否则只用 userFocusHazards
  const chartHazards = userFocusHazards.length
    ? userFocusHazards
    : selectedHazards;

  // 1) 先抽取 relevantRecords: incidentType in selectedHazards
  const relevantRecords = allFemaRecords.filter((rec) =>
    selectedHazards.includes(rec.incidentType)
  );

  // 2) 解析 rec.incidentBeginDate -> year
  // aggregator=year => xKey = "YYYY"
  // aggregator=decade => xKey = "YYYYs" e.g. "1970s"
  let minYear = 9999;
  let maxYear = 0;
  const parsed = relevantRecords.map((r) => {
    let y = 1900;
    if (r.incidentBeginDate) {
      const tmp = new Date(r.incidentBeginDate);
      y = tmp.getFullYear();
    }
    if (y < minYear) minYear = y;
    if (y > maxYear) maxYear = y;
    return {
      incidentType: r.incidentType,
      year: y,
    };
  });
  if (minYear > maxYear) {
    // 说明根本没记录 => 返回空chart
    minYear = 0;
    maxYear = 0;
  }

  // aggregator => xVal
  function getXVal(yearNum) {
    if (aggregator === 'year') return yearNum.toString();
    // "decade"
    // 例如 1970~1979 => "1970s"
    // 2001 => 2000s
    const decadeStart = Math.floor(yearNum / 10) * 10;
    return decadeStart + 's';
  }

  // 3) 构建 => { [xVal]: { hazardA: count, hazardB: count, ... } }
  const grouped = {};
  parsed.forEach((item) => {
    const xVal = getXVal(item.year);
    if (!grouped[xVal]) {
      grouped[xVal] = {};
    }
    const hazard = item.incidentType;
    if (!grouped[xVal][hazard]) {
      grouped[xVal][hazard] = 0;
    }
    grouped[xVal][hazard]++;
  });

  // 4) 按 aggregator => 构造 xVals
  //   if aggregator="year", x从 minYear..maxYear
  //   if aggregator="decade", x从 (floor(minYear/10)*10) 到 (floor(maxYear/10)*10)
  let xValList = [];
  if (aggregator === 'year') {
    for (let y = minYear; y <= maxYear; y++) {
      xValList.push(getXVal(y));
    }
  } else {
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    for (let d = startDecade; d <= endDecade; d += 10) {
      xValList.push(d + 's');
    }
  }

  // 5) 构建 final data array => each item = { xVal, hazardA: n, hazardB: n, ... }
  //   for xVal in xValList => for hazard in chartHazards
  const chartData = xValList.map((xval) => {
    const row = { xval };
    chartHazards.forEach((hz) => {
      row[hz] = grouped[xval]?.[hz] || 0;
    });
    return row;
  });

  // X轴自定义tick: 仅显示 "1970" "1980" "1990" "2000" "2010" "2020" 当 aggregator=year
  // aggregator=decade => 全部直接显示 "1970s" "1980s" ...
  function xAxisTickFormatter(value) {
    if (aggregator === 'decade') {
      return value; // "1970s", "1980s", ...
    }
    // aggregator=year => value is e.g. "1977"
    // show label only if it's multiple of 10
    const numYear = Number(value);
    if (!Number.isNaN(numYear) && numYear % 10 === 0) {
      return value;
    }
    return ''; // don't show label
  }
  // ========== Color logic for hazards =======
  // define a dynamic color function => each hazard => hue
  // if we have N hazards, distribute them evenly in [0..360)
  // for stable order => sort hazards
  const sortedHazards = [...chartHazards].sort();
  const colorMap = useMemo(() => {
    const mapObj = {};
    const n = sortedHazards.length;
    sortedHazards.forEach((hz, idx) => {
      const hue = Math.round((360 / n) * idx);
      // give some fixed saturation/lightness => produce "in harmony" pastel
      const sat = 60; // can tweak
      const light = 60; // can tweak
      mapObj[hz] = `hsl(${hue}, ${sat}%, ${light}%)`;
    });
    return mapObj;
    // eslint-disable-next-line
  }, [JSON.stringify(sortedHazards)]);

  function getColorForHazard(hz) {
    return colorMap[hz] || '#888888';
  }
  // =========== Focus Hazards UI ==============
  // user can check or uncheck each hazard in selectedHazards => store in userFocusHazards
  function handleFocusHazardToggle(hz) {
    setUserFocusHazards((prev) => {
      if (prev.includes(hz)) {
        return prev.filter((h) => h !== hz);
      } else {
        return [...prev, hz];
      }
    });
  }
  // if userFocusHazards is empty => means show all
  function isHazardFocused(hz) {
    return userFocusHazards.length ? userFocusHazards.includes(hz) : true; // default all
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Likelihood Assessment
      </Typography>
      <Typography paragraph>
        1) Each hazard's frequency by year or decade. 2) Assign a 1~5
        likelihood. 3) Clear if needed.
      </Typography>

      {/* Clear */}
      <Button
        variant="outlined"
        color="error"
        onClick={handleClearLikelihood}
        sx={{ mb: 2 }}
      >
        Clear Current Input
      </Button>

      {/* Aggregator Switch */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        <Typography>Aggregation:</Typography>
        <RadioGroup
          row
          value={aggregator}
          onChange={(e) => setAggregator(e.target.value)}
        >
          <FormControlLabel value="year" control={<Radio />} label="By Year" />
          <FormControlLabel
            value="decade"
            control={<Radio />}
            label="By Decade"
          />
        </RadioGroup>
      </Box>

      {/* Focus hazard checkboxes */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography>Focus Hazards:</Typography>
        {selectedHazards.map((hz) => {
          const checked = userFocusHazards.includes(hz);
          return (
            <FormControlLabel
              key={hz}
              control={
                <Checkbox
                  checked={checked}
                  onChange={() => handleFocusHazardToggle(hz)}
                />
              }
              label={hz}
            />
          );
        })}
        <Tooltip title="If no hazard is checked, chart includes all hazards.">
          <Typography variant="body2" color="text.secondary">
            (Leave blank to show all)
          </Typography>
        </Tooltip>
      </Box>

      {/* Chart */}
      <Paper sx={{ width: '100%', height: 400, p: 1, mb: 2 }}>
        {chartData.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No records found for your selected hazards.
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="xval"
                tickFormatter={xAxisTickFormatter}
                interval={0} // ensure we check every tick
              />
              <YAxis />
              <RTooltip />
              <Legend />
              {/* For each hazard in chartHazards => one <Bar dataKey=hz> */}
              {chartHazards.map((hz, idx) => {
                // pick color? you can define a color array
                // const colorArr = [
                //   '#8884d8',
                //   '#82ca9d',
                //   '#ffc658',
                //   '#d84f52',
                //   '#6a9cf3',
                //   '#29cae4',
                // ];
                // const barColor = colorArr[idx % colorArr.length];
                const barColor = getColorForHazard(hz);
                return <Bar key={hz} dataKey={hz} fill={barColor} />;
              })}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Likelihood input table */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Set Likelihood (1~5)
      </Typography>
      <Paper sx={{ maxWidth: 400, p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hazard</TableCell>
              <TableCell>Likelihood</TableCell>
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
    </Box>
  );
};

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
