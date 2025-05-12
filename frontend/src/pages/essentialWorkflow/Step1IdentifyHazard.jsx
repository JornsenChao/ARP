// src/pages/essentialWorkflow/Step1IdentifyHazard.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Toolbar,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Stack,
  Divider,
  Select,
  MenuItem,
  List,
  ListItem,
  Checkbox,
  Collapse,
  Card,
  CardContent,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';
import StepProgressBar from './StepProgressBar';
// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

/**
 * CustomYAxisTick:
 *   - 点击图表左侧hazard名即可选中/取消 hazard
 *   - 已选hazard高亮显示
 */
function CustomYAxisTick(props) {
  const { x, y, payload, toggleHazard, selectedHazards } = props;
  const hazardType = payload.value;
  const isSelected = selectedHazards.includes(hazardType);

  // 点击文字也要切换
  const handleTextClick = () => {
    toggleHazard(hazardType);
  };

  // 勾选框onChange
  const handleCheckboxChange = (e) => {
    // 阻止事件冒泡，避免和点击 text 冲突
    e.stopPropagation();
    toggleHazard(hazardType);
  };

  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}>
      {/* 1) foreignObject宽度可以略大一些，以容纳checkbox + text */}
      <foreignObject x={-140} y={-10} width={140} height={24}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
          // 给div加点击事件 => 也能点击文字
          onClick={handleTextClick}
        >
          {/* 2) Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            style={{
              marginRight: 4,
              cursor: 'pointer',
              alignContent: 'center',
            }}
          />
          {/* 3) Hazard文本 */}
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: isSelected ? 'bold' : 'normal',
              color: isSelected ? '#1976d2' : '#666',
            }}
          >
            {hazardType}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}

function Step1IdentifyHazard() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  // 如果workflowState还没加载，就先“Loading”
  if (!workflowState) {
    return (
      <Box sx={{ mt: 8, p: 2 }}>
        <Toolbar />
        <Typography>Loading Step1...</Typography>
      </Box>
    );
  }

  // ======= 1) 从后端workflow里拿到 step1 数据  =======
  // 选中的 hazards
  const selectedHazards = workflowState.step1.hazards || [];
  // searchMode, location, femaRecords, startDate, endDate
  // 这些属性在后端: workflowState.step1.xxx

  // ======= 2) 本地 state =======
  const [searchMode, setSearchMode] = useState('state');
  const [locationInput, setLocationInput] = useState('');
  // 本地保存“所有 FEMA 记录”，供前端做日期筛选
  const [allRecords, setAllRecords] = useState([]);
  // date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ======= 3) 把后端 step1.* 同步到本地 state =======
  useEffect(() => {
    if (!workflowState.step1) return;

    setSearchMode(workflowState.step1.searchMode || 'state');
    setLocationInput(workflowState.step1.location || '');
    setAllRecords(workflowState.step1.femaRecords || []);
    setStartDate(workflowState.step1.startDate || '');
    setEndDate(workflowState.step1.endDate || '');
  }, [workflowState]);
  const [guideExpanded, setGuideExpanded] = useState(true);
  // ======= 4) 修改地点 => 立刻清空 hazards / femaRecords / start/endDate =======
  function handleLocationChange(e) {
    const newLoc = e.target.value;
    const oldLoc = workflowState.step1.location || '';
    // 如果和后端存的不一样 => 重置
    if (newLoc.trim().toLowerCase() !== oldLoc.trim().toLowerCase()) {
      // 1) 后端清空
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step1.hazards = [];
        updated.step1.femaRecords = [];
        updated.step1.startDate = '';
        updated.step1.endDate = '';
        updated.step1.location = newLoc;
        // 同时清空 step2 相关
        updated.step2.impactData = [];
        updated.step2.likelihoodData = [];
        updated.step2.selectedRisks = [];
        return updated;
      });
      // 2) 前端本地也清空
      setLocationInput(newLoc);
      setAllRecords([]);
      setStartDate('');
      setEndDate('');
    } else {
      // 否则就只是同步下本地输入
      setLocationInput(newLoc);
    }
  }

  // ======= 5) 修改 searchMode => 立刻清空 hazards / femaRecords / start/endDate =======
  function handleSearchModeChange(e) {
    const newMode = e.target.value;
    const oldMode = workflowState.step1.searchMode || 'state';
    if (newMode !== oldMode) {
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step1.hazards = [];
        updated.step1.femaRecords = [];
        updated.step1.startDate = '';
        updated.step1.endDate = '';
        updated.step1.searchMode = newMode;
        updated.step1.location = ''; // 也可把location一起重置 => 看需求
        return updated;
      });
      setSearchMode(newMode);
      // 前端本地清空
      setLocationInput('');
      setAllRecords([]);
      setStartDate('');
      setEndDate('');
    } else {
      setSearchMode(newMode);
    }
  }

  // ======= 6) 修改 startDate/endDate => 后端也一起存 =======
  function handleStartDateChange(e) {
    const val = e.target.value;
    setStartDate(val);
    // 立即写回后端
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.startDate = val;
      return updated;
    });
  }
  function handleEndDateChange(e) {
    const val = e.target.value;
    setEndDate(val);
    // 立即写回后端
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.endDate = val;
      return updated;
    });
  }

  // ======= 7) Fetch FEMA Data => 仅当用户点击按钮 =======
  async function fetchFemaData() {
    if (!locationInput.trim()) return;
    setLoading(true);
    setError('');
    setAllRecords([]);

    try {
      const url = `http://localhost:8000/workflow/hazards?mode=${searchMode}&location=${encodeURIComponent(
        locationInput
      )}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();
      const records = data.records || [];

      // 前端保存
      setAllRecords(records);

      // 后端也保存 => step1.femaRecords, location, searchMode
      setWorkflowState((prev) => {
        const updated = { ...prev };
        updated.step1.femaRecords = records;
        updated.step1.location = locationInput;
        updated.step1.searchMode = searchMode;
        // startDate/endDate 留当前值即可
        updated.step1.startDate = startDate;
        updated.step1.endDate = endDate;
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Error fetching from server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ======= 8) 选中/取消 hazard => 改后端 step1.hazards =======
  function toggleHazard(hazard) {
    const has = selectedHazards.includes(hazard);
    let newArr;
    if (has) {
      newArr = selectedHazards.filter((h) => h !== hazard);
    } else {
      newArr = [...selectedHazards, hazard];
    }
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.hazards = newArr;
      return updated;
    });
  }

  // ======= 9) Clear hazards 手动按钮 =======
  function clearSelectedHazards() {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.hazards = [];
      return updated;
    });
  }

  // ======= 10) 仅前端过滤 => startDate/endDate 不改变 allRecords =======
  const filteredRecords = useMemo(() => {
    if (!allRecords.length) return [];
    if (!startDate && !endDate) return allRecords;

    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;

    return allRecords.filter((rec) => {
      const dtStr = rec.incidentBeginDate;
      if (!dtStr) return false;
      const dt = new Date(dtStr);
      if (s && dt < s) return false;
      if (e && dt > e) return false;
      return true;
    });
  }, [allRecords, startDate, endDate]);

  // 统计 freq
  const freqMap = {};
  filteredRecords.forEach((r) => {
    const t = r.incidentType || 'Unknown';
    freqMap[t] = (freqMap[t] || 0) + 1;
  });
  const chartData = Object.entries(freqMap).map(([type, count]) => ({
    type,
    count,
  }));
  const rowHeight = 35;
  const dynamicHeight = chartData.length
    ? Math.max(chartData.length * rowHeight, 300)
    : 300;
  const finalRecords = useMemo(() => {
    // 若无已选 hazards，直接返回空数组
    if (selectedHazards.length === 0) {
      return [];
    }
    // 否则仅保留 incidentType 属于 selectedHazards 的记录
    return filteredRecords.filter((rec) =>
      selectedHazards.includes(rec.incidentType)
    );
  }, [filteredRecords, selectedHazards]);
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
        Step 1: Identify Hazard
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          mb: 2,
        }}
      >
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
              1) You can search hazards by <strong>State</strong> or{' '}
              <strong>County+State</strong>. Examples:
              <ul>
                <li>State Code: "WA"</li>
                <li>County &amp; State: "King, WA"</li>
              </ul>
              This helps us retrieve relevant FEMA data for that region.
            </Typography>

            <Typography paragraph>
              2) You can optionally apply a <strong>date range filter</strong>{' '}
              to narrow down the displayed historical records. Once data is
              fetched, a bar chart will illustrate frequency of incident types
              by year.
            </Typography>

            <Typography paragraph>
              3) After reviewing the chart,{' '}
              <strong>select at least one hazard</strong> to continue. The
              chosen hazards will appear below, and you can see more details
              from the FEMA records.
            </Typography>
          </Box>

          <Box sx={{ my: 2, p: 2, border: '1px dashed #ccc' }}>
            <Typography variant="subtitle1" gutterBottom>
              Where does this data come from?
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Data Source</strong> – This page calls FEMA&apos;s
              official
              <em>Disaster Declarations Summaries</em> API:
              <ul>
                <li>
                  <strong>Endpoint</strong>:
                  https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries
                </li>
              </ul>
              We only visualize hazards that FEMA has catalogued in that
              dataset.
            </Typography>
            <Typography variant="body2">
              <em>Note:</em> If your region has limited or no FEMA records, the
              chart and table may display fewer results.
            </Typography>
          </Box>
        </Collapse>
      </Paper>
      {/* 用Paper包裹大区块，结构更清晰 */}
      {/* =========== 新的 Paper: "Location & FEMA Data Lookup" =========== */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Search Hazard by Location
        </Typography>

        {/* 两个模式 (STATE) + (COUNTY+STATE) 并列 */}
        <Stack direction="row" spacing={3}>
          {/* Card 1: State mode */}
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: searchMode === 'state' ? 'primary.main' : '#ccc',
              cursor: 'pointer',
            }}
            onClick={() => {
              // 点击卡片 => 切换模式, 并清空 locationInput
              // 或者只设置 searchMode, 看你需求
              setSearchMode('state');
              // 这里若需要清空location,自己看需求
              if (searchMode !== 'state') setLocationInput('');
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1 }}
                color={searchMode === 'state' ? 'primary' : 'text.secondary'}
              >
                Search by State Code
              </Typography>
              {/* 若非 state 模式，就禁用输入 */}
              <TextField
                label="State Code (e.g. WA)"
                size="small"
                disabled={searchMode !== 'state'}
                value={searchMode === 'state' ? locationInput : ''}
                onChange={(e) => setLocationInput(e.target.value)}
                sx={{ mb: 1 }}
                fullWidth
              />
              <Button
                variant="contained"
                disabled={searchMode !== 'state' || !locationInput.trim()}
                onClick={fetchFemaData}
              >
                Fetch FEMA Data
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: County+State mode */}
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              borderColor: searchMode === 'county' ? 'primary.main' : '#ccc',
              cursor: 'pointer',
            }}
            onClick={() => {
              setSearchMode('county');
              if (searchMode !== 'county') setLocationInput('');
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', mb: 1 }}
                color={searchMode === 'county' ? 'primary' : 'text.secondary'}
              >
                Search by County, State
              </Typography>
              <TextField
                label="County, State (e.g. King, WA)"
                size="small"
                disabled={searchMode !== 'county'}
                value={searchMode === 'county' ? locationInput : ''}
                onChange={(e) => setLocationInput(e.target.value)}
                sx={{ mb: 1 }}
                fullWidth
              />
              <Button
                variant="contained"
                disabled={searchMode !== 'county' || !locationInput.trim()}
                onClick={fetchFemaData}
              >
                Fetch FEMA Data
              </Button>
            </CardContent>
          </Card>
          {/* Card 3: Date Filter */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Time Range Filter
              </Typography>
              {/* Date Filter */}
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={handleStartDateChange}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={handleEndDateChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {loading && (
          <Typography sx={{ mt: 1 }} color="text.secondary">
            Loading...
          </Typography>
        )}
        {error && (
          <Typography sx={{ mt: 1 }} color="error">
            Error: {error}
          </Typography>
        )}
        {/* 在两个 Card 下方，再加一个 Card 用于“时间过滤” */}
        <Box sx={{ mt: 3 }}></Box>
      </Paper>

      {/* 图表展示 */}
      {filteredRecords.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            IncidentType Frequency
          </Typography>

          <Box sx={{ width: '100%', height: dynamicHeight, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="type"
                  type="category"
                  width={120}
                  tick={(props) => (
                    <CustomYAxisTick
                      {...props}
                      toggleHazard={toggleHazard}
                      selectedHazards={selectedHazards}
                    />
                  )}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          {/* 选中的 hazards + clear 按钮 */}
          <Box sx={{ mt: 1 }}>
            <Typography>
              Selected Hazards: {selectedHazards.join(', ')}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={clearSelectedHazards}
              size="small"
              sx={{ mt: 1 }}
            >
              Clear Selected Hazards
            </Button>
          </Box>
        </Paper>
      )}

      {/* Disaster records list */}
      {selectedHazards.length > 0 && finalRecords.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Disaster Records of Selected Hazards
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', mt: 1 }}>
            <List>
              {finalRecords.map((rec, idx) => {
                const {
                  incidentType,
                  title,
                  incidentBeginDate,
                  incidentEndDate,
                } = rec;
                // 这里不再需要 isSelected checks, 因为 finalRecords 已是已选 hazards
                return (
                  <ListItem
                    key={idx}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 'bold' }}>{title}</Typography>
                    <Typography variant="body2">
                      Type: {incidentType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Begin: {incidentBeginDate?.slice(0, 10) || 'N/A'} | End:{' '}
                      {incidentEndDate?.slice(0, 10) || 'N/A'}
                    </Typography>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>
      )}

      {/* Next Step */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={selectedHazards.length === 0}
          component={Link}
          to="/workflow/step2"
        >
          Next Step (Step2)
        </Button>
      </Box>
    </Box>
  );
}

export default Step1IdentifyHazard;
