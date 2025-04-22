// src/pages/essentialWorkflow/Step1IdentifyHazard.jsx
import React, { useContext, useState, useEffect } from 'react';
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
 * 自定义 Y 轴 tick，让用户可点灾害名称。
 *  - props里重要的是 payload.value (灾害类型)
 *  - 以及我们注入的 toggleHazard / selectedHazards
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
      dy={4} // 让文字居中
      textAnchor="end"
      fill={isSelected ? '#1976d2' : '#666'} // 选中后高亮
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
  const { workflowState, updateStep1Hazards, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  // -------------- 搜索相关 --------------
  const [searchMode, setSearchMode] = useState('state'); // "state" or "county"
  const [locationInput, setLocationInput] = useState('');
  const [allRecords, setAllRecords] = useState([]); // 后端返回的 FEMA数据

  // -------------- 时间段筛选 --------------
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // -------------- 加载状态 / 错误 --------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step1...</Box>;
  }

  // 用户已选 hazards
  const selectedHazards = workflowState.step1.hazards || [];

  // 点击“Fetch FEMA Hazards” => 调后端
  async function fetchFemaData() {
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
      if (data.records) {
        setAllRecords(data.records);
      } else {
        setError('No "records" array in response');
      }
    } catch (err) {
      setError(err.message || 'Error fetching from server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // 切换 hazards 选中
  function toggleHazard(hazard) {
    const currentSelected = selectedHazards;
    if (currentSelected.includes(hazard)) {
      updateStep1Hazards(currentSelected.filter((h) => h !== hazard));
    } else {
      updateStep1Hazards([...currentSelected, hazard]);
    }
  }

  // 更新 step1.hazards + 同步到后端
  // function updateStep1Hazards(newHazards) {
  //   setWorkflowState((prev) => {
  //     const updated = { ...prev };
  //     updated.step1.hazards = newHazards;
  //     return updated;
  //   });
  // }

  // 将 allRecords 存入 workflowState.step1.femaRecords
  function saveAllRecordsToState() {
    setWorkflowState((prev) => {
      const updated = { ...prev };
      updated.step1.femaRecords = allRecords;
      return updated;
    });
  }

  // -------------- 时间段过滤 --------------
  function filterByDateRange(records) {
    if (!startDate && !endDate) return records;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return records.filter((r) => {
      if (!r.incidentBeginDate) return false;
      const d = new Date(r.incidentBeginDate);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  const filteredRecords = filterByDateRange(allRecords);

  // -------------- 计算 incidentType 频率 --------------
  const freqMap = {};
  filteredRecords.forEach((rec) => {
    const t = rec.incidentType || 'Unknown';
    freqMap[t] = (freqMap[t] || 0) + 1;
  });
  // 转为 Recharts 数据
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

      {/* 搜索模式 */}
      <Box sx={{ mb: 2 }}>
        <FormLabel>Search Mode</FormLabel>
        <RadioGroup
          row
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value)}
        >
          <FormControlLabel
            value="state"
            control={<Radio />}
            label='Search by State (e.g. "MA")'
          />
          <FormControlLabel
            value="county"
            control={<Radio />}
            label='Search by County+State (e.g. "King, WA")'
          />
        </RadioGroup>
      </Box>

      {/* 输入框 + 搜索按钮 */}
      <TextField
        label={
          searchMode === 'state'
            ? 'Enter state code (e.g. WA)'
            : 'Enter County, State (e.g. King, WA)'
        }
        value={locationInput}
        onChange={(e) => setLocationInput(e.target.value)}
        sx={{ mb: 1, mr: 1 }}
      />
      <Button variant="outlined" onClick={fetchFemaData}>
        Fetch FEMA Hazards
      </Button>

      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
      {error && (
        <Typography sx={{ mt: 2, color: 'red' }}>Error: {error}</Typography>
      )}

      {/* 时间段筛选 */}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* 频率分布图 */}
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
              {/* 
                自定义 Y 轴 tick, 让用户可点击 hazardType 
              */}
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

      {/* 事件列表：可点击“标题”来查看信息 or 点击其 incidentType 也能选中 */}
      <Typography variant="h6">
        Fetched Disaster Records (Filtered by Date)
      </Typography>
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

      {/* 显示目前选中的 hazards */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          Selected Hazards: {selectedHazards.join(', ') || 'None'}
        </Typography>
      </Box>

      {/* <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={allRecords.length === 0}
          onClick={saveAllRecordsToState}
        >
          Save FEMA Records to State
        </Button>
      </Box> */}

      {/* 下一步按钮 */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={selectedHazards.length === 0}
          onClick={saveAllRecordsToState}
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
