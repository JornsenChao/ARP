// src/pages/essentialWorkflow/step2/LikelihoodAssessment.jsx

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
  Collapse,
  RadioGroup,
} from '@mui/material';
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
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';

const LikelihoodAssessment = () => {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

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

  // ===== 新增：模型模式 & 解释方式 =====
  const [modelApproach, setModelApproach] = useState('quickGamma'); // or "metroGamma"
  const [interpretation, setInterpretation] = useState('prob30'); // or "annual30"

  // 顶部指南展开/收起
  const [guideExpanded, setGuideExpanded] = useState(true);

  useEffect(() => {
    buildLocalLikelihoodFromServer();
  }, []);

  async function buildLocalLikelihoodFromServer() {
    try {
      const res = await fetch('http://localhost:8000/workflow');
      if (!res.ok) throw new Error('Failed to fetch workflow');
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
    if (!valStr) {
      return setLikelihoodMap((prev) => ({ ...prev, [hazard]: '' }));
    }
    let val = parseInt(valStr, 10);
    if (isNaN(val)) {
      return setLikelihoodMap((prev) => ({ ...prev, [hazard]: '' }));
    }
    if (val === 0) {
      return setLikelihoodMap((prev) => ({ ...prev, [hazard]: 0 }));
    }
    if (val < 1) val = 1;
    if (val > 5) val = 5;
    setLikelihoodMap((prev) => ({ ...prev, [hazard]: val }));
  }

  async function handleLikelihoodBlur(hazard) {
    const rating = likelihoodMap[hazard];
    if (rating === '') return;

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

  // =========== 新增：Auto-Fill from Bayesian Model =============
  async function handleAutoFill() {
    try {
      // 调用后端 model-likelihood
      const url = `http://localhost:8000/workflow/step2/model-likelihood?modelApproach=${modelApproach}&interpretation=${interpretation}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to get model-likelihood');
      const data = await res.json();
      const items = data.data || [];

      for (const item of items) {
        let rating = item.suggestedValue;
        // interpretation=prob30 => rating is 1..5
        // interpretation=annual30 => rating 可能是float，需要转 1..5
        if (interpretation === 'annual30') {
          // 例如先round
          let r = Math.round(rating);
          if (r < 1) r = 1;
          if (r > 5) r = 5;
          rating = r;
        }
        // POST /workflow/step2/likelihood
        const resp = await fetch(
          'http://localhost:8000/workflow/step2/likelihood',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hazard: item.hazard,
              likelihoodRating: rating,
            }),
          }
        );
        if (!resp.ok) {
          console.warn('Failed to post hazard', item.hazard, rating);
        }
      }

      // 全部提交后，刷新state
      await refreshWorkflow();
      alert('Auto-Fill done.');
    } catch (err) {
      console.error(err);
      alert('Auto-Fill error: ' + err.message);
    }
  }

  // 重新获取workflow => 更新likelihoodMap
  async function refreshWorkflow() {
    try {
      const stRes = await fetch('http://localhost:8000/workflow');
      const wf = await stRes.json();
      // 更新全局
      setWorkflowState(wf);

      // 同时更新本组件
      const arr = wf?.step2?.likelihoodData || [];
      const tempMap = {};
      arr.forEach((item) => {
        tempMap[item.hazard] = item.likelihoodRating;
      });
      setLikelihoodMap(tempMap);
    } catch (err) {
      console.error('Error refreshWorkflow:', err);
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
  const relevantRecords = allFemaRecords.filter((r) =>
    selectedHazards.includes(r.incidentType)
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
    if (!grouped[xVal]) grouped[xVal] = {};
    const hz = item.incidentType;
    if (!grouped[xVal][hz]) grouped[xVal][hz] = 0;
    grouped[xVal][hz]++;
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

  function getLikelihoodBgColor(r) {
    if (!r || isNaN(r)) return 'transparent';
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

  return (
    <Box>
      {/* 顶部 guide paper (可折叠) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
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
              1) Each hazard's frequency can be shown by year or decade. You can
              also check the hazards you are most concerned about.
            </Typography>
            <Typography paragraph>
              2) Then, you can set the likelihood (1~5) for each hazard. You can
              either type it in manually or use the Auto-Fill button to get a
              suggestion.
            </Typography>
            <Typography paragraph>
              If you typed "0" - automatically remove the value. Ranges 1..5 are
              color-coded.
            </Typography>
          </Box>
          <Box sx={{ my: 2, p: 2, border: '1px dashed #ccc' }}>
            <Typography variant="subtitle1" gutterBottom>
              How do these "auto-fill" options work?
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Model Approach</strong> – We offer two Bayesian methods:
              <ul>
                <li>
                  <strong>QuickGamma</strong>: A simpler method with a fixed
                  small prior (e.g. α=1, β=5). It’s fast and straightforward for
                  quickly estimating hazard frequency when data are sparse.
                </li>
                <li>
                  <strong>MetroGamma</strong>: A slightly more advanced approach
                  that uses a mini “Metropolis” sampling under a similar prior.
                  This can yield more robust posterior estimates in some cases,
                  but is computationally heavier.
                </li>
              </ul>
            </Typography>

            <Typography variant="body2" paragraph>
              <strong>Interpretation</strong> – This determines how we convert
              the Bayesian estimate (<em>annual rate λ</em>) into a 1–5 rating:
              <ul>
                <li>
                  <strong>prob30</strong>: We first calculate the probability of
                  at least one event over the next 30 years (
                  <em>
                    p = 1 - e<sup>−30λ</sup>
                  </em>
                  ), then map that to a 1–5 scale using thresholds (e.g., &lt;5%
                  = 1, &lt;20% = 2, etc.).
                </li>
                <li>
                  <strong>annual30</strong>: We interpret your annual rate as a
                  rough index of how many times per year (on average) a hazard
                  might occur over a 30-year horizon, then map that rate to 1–5.
                  Hazards with very low rates will show up as 1 (rare), while
                  higher rates become 4–5, etc.
                </li>
              </ul>
            </Typography>

            <Typography variant="body2">
              <em>
                Note: After Auto-Fill, you can still manually adjust any
                hazard's final 1–5 rating if needed.
              </em>
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* Chart */}
      <Paper
        sx={{ width: '100%', maxHeight: 600, height: 500, p: 1, mb: 2 }}
        variant="outlined"
      >
        <Typography variant="h6">Hazard Frequency</Typography>
        {/* Aggregator Switch */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
          <Typography>Aggregation:</Typography>
          <RadioGroup
            row
            value={aggregator}
            onChange={(e) => setAggregator(e.target.value)}
          >
            <FormControlLabel
              value="year"
              control={<Radio />}
              label="By Year"
            />
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
        {chartData.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No records found for your selected hazards.
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height="70%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="xval"
                tickFormatter={xAxisTickFormatter}
                interval={0}
              />
              <YAxis />
              <RTooltip />
              <Legend />
              {chartHazards.map((hz, idx) => {
                const barColor = getColorForHazard(hz);
                return <Bar key={hz} dataKey={hz} fill={barColor} />;
              })}
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Typography variant="h6">Assess Likelihood</Typography>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          <ul>
            <li> you can type manually</li>
            <li> or use Auto-Fill</li>
          </ul>
        </Typography>
        {/* 下面是 aggregator, autoFill, etc */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearLikelihood}
          >
            Clear Current
          </Button>

          {/* modelApproach */}
          <FormControl size="small">
            <InputLabel>Model Approach</InputLabel>
            <Select
              label="Model Approach"
              value={modelApproach}
              onChange={(e) => setModelApproach(e.target.value)}
              sx={{ width: 130 }}
            >
              <MenuItem value="quickGamma">QuickGamma</MenuItem>
              <MenuItem value="metroGamma">MetroGamma</MenuItem>
            </Select>
          </FormControl>

          {/* interpretation */}
          <FormControl size="small">
            <InputLabel>Interpretation</InputLabel>
            <Select
              label="Interpretation"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              sx={{ width: 130 }}
            >
              <MenuItem value="prob30">prob30 (1-5 rating)</MenuItem>
              <MenuItem value="annual30">annual30 (float→1-5)</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleAutoFill}>
            Auto-Fill
          </Button>
        </Box>
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
                      sx={{
                        width: 60,
                        backgroundColor: val
                          ? getLikelihoodBgColor(parseInt(val))
                          : 'transparent',
                      }}
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

export default LikelihoodAssessment;
