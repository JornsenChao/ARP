// src/pages/essentialWorkflow/Step1IdentifyHazard.jsx
import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Toolbar,
  TextField,
  List,
  ListItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

// === Recharts 组件 ===
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

  const handleClick = () => {
    toggleHazard(hazardType);
  };

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={isSelected ? '#1976d2' : '#666'}
      style={{
        cursor: 'pointer',
        fontWeight: isSelected ? 'bold' : 'normal',
      }}
      onClick={handleClick}
    >
      {hazardType}
    </text>
  );
}

function Step1IdentifyHazard() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  // 如果workflowState还没加载，就先“Loading”
  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step1...</Box>;
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

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />

      <Typography variant="h5" gutterBottom>
        Step 1: Identify Hazard
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormLabel>Search Mode</FormLabel>
        <RadioGroup row value={searchMode} onChange={handleSearchModeChange}>
          <FormControlLabel
            value="state"
            control={<Radio />}
            label='Search by State (e.g. "WA")'
          />
          <FormControlLabel
            value="county"
            control={<Radio />}
            label='Search by County+State (e.g. "King, WA")'
          />
        </RadioGroup>
      </Box>

      <TextField
        label={
          searchMode === 'state'
            ? 'Enter state code (e.g. WA)'
            : 'Enter County, State (e.g. King, WA)'
        }
        value={locationInput}
        onChange={handleLocationChange}
        sx={{ mb: 1, mr: 1 }}
      />
      <Button variant="outlined" onClick={fetchFemaData}>
        Fetch FEMA Hazards
      </Button>

      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
      {error && (
        <Typography sx={{ mt: 2, color: 'red' }}>Error: {error}</Typography>
      )}

      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {filteredRecords.length > 0 && (
        <Box sx={{ height: 300, width: '100%', mb: 3 }}>
          <Typography variant="h6">
            IncidentType Frequency (Filtered by Date)
          </Typography>
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
      )}

      <Typography variant="h6">Fetched Disaster Records (Filtered)</Typography>
      <List
        sx={{
          maxHeight: 200,
          overflowY: 'auto',
          border: '1px solid #ccc',
          mt: 1,
        }}
      >
        {filteredRecords.map((rec, idx) => {
          const { incidentType, title, incidentBeginDate, incidentEndDate } =
            rec;
          const isSelected = selectedHazards.includes(incidentType);
          return (
            <ListItem
              key={idx}
              button
              onClick={() => toggleHazard(incidentType)}
              sx={{
                backgroundColor: isSelected ? '#e0f7fa' : 'transparent',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
              <Typography variant="body2">
                Type: {incidentType} {isSelected && '(selected)'}
              </Typography>
              <Typography variant="caption">
                Begin:{' '}
                {incidentBeginDate ? incidentBeginDate.slice(0, 10) : 'N/A'} |
                End: {incidentEndDate ? incidentEndDate.slice(0, 10) : 'N/A'}
              </Typography>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 2 }}>
        <Typography>
          Selected Hazards: {selectedHazards.join(', ') || 'None'}
        </Typography>
      </Box>

      <Box sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={clearSelectedHazards}
          disabled={selectedHazards.length === 0}
        >
          Clear Selected Hazards
        </Button>
      </Box>

      {/* NextStep: 只有选了hazard才可前往 step2 */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={selectedHazards.length === 0}
          component={Link}
          to="/workflow/step2"
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
}

export default Step1IdentifyHazard;
