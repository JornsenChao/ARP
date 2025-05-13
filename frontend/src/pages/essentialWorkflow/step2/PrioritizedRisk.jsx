// src/pages/essentialWorkflow/step2/PrioritizedRisk.jsx

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
  Radio,
  RadioGroup,
  Collapse,
} from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';
import { API_BASE as DOMAIN } from '../../../utils/apiBase';

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

  // 说明区域展开/收起
  const [explanationExpanded, setExplanationExpanded] = useState(true);

  useEffect(() => {
    if (activeTabIndex === 2) {
      fetchAll();
    }
    // eslint-disable-next-line
  }, [activeTabIndex]);

  const [matrixData, setMatrixData] = useState([]);

  useEffect(() => {
    // 先把 riskResult 按 "impactRating::likelihoodRating" 分组
    const groupMap = {};
    riskResult.forEach((r) => {
      const key = `${r.impactRating}::${r.likelihoodRating}`;
      if (!groupMap[key]) {
        groupMap[key] = [];
      }
      groupMap[key].push(r);
    });

    const transformed = [];
    // 遍历每组
    Object.values(groupMap).forEach((arr) => {
      if (arr.length === 1) {
        // 只有1个 => 不需要偏移
        const r = arr[0];
        transformed.push({
          x: r.likelihoodRating,
          y: r.impactRating,
          actualX: r.likelihoodRating,
          actualY: r.impactRating,
          hazard: r.hazard,
          systemName: r.systemName,
          subSystemName: r.subSystemName,
          riskScore: r.riskScore,
        });
      } else {
        // 有重复 => 给每个点做一点随机抖动
        arr.forEach((r) => {
          const jitterX = (Math.random() - 0.5) * 0.15; // 抖动范围±0.2
          const jitterY = (Math.random() - 0.5) * 0.3; // 可自行调整
          transformed.push({
            x: r.likelihoodRating + jitterX,
            y: r.impactRating + jitterY,
            actualX: r.likelihoodRating, // 用于tooltip显示真实值
            actualY: r.impactRating,
            hazard: r.hazard,
            systemName: r.systemName,
            subSystemName: r.subSystemName,
            riskScore: r.riskScore,
          });
        });
      }
    });

    setMatrixData(transformed);
  }, [riskResult]);
  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      // 1) 获取 workflow => 拿到impact / likelihood
      const wfRes = await fetch(`${DOMAIN}/workflow`);
      if (!wfRes.ok) throw new Error('Error fetching workflow state');
      const wfData = await wfRes.json();

      const impactArr = wfData.step2?.impactData || [];
      const likelihoodArr = wfData.step2?.likelihoodData || [];
      setImpactCount(impactArr.length);
      setLikelihoodCount(likelihoodArr.length);

      // 2) 获取 risk
      let url = `${DOMAIN}/workflow/step2/risk`;
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
      await fetch(`${DOMAIN}/workflow/step2/complete`, {
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
  function RiskDot(props) {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null; // 防御
    const color = getRiskColor(payload.riskScore);
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={color}
        stroke="#333"
        strokeWidth={0.5}
        fillOpacity={1.0}
      />
    );
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
      await fetch(`${DOMAIN}/workflow/step2/select-risk`, {
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

  function sortedRiskRows() {
    let arr = [...riskResult];
    if (!sortBy) return arr;
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'system':
          return a.systemName.localeCompare(b.systemName);
        case 'hazard':
          return a.hazard.localeCompare(b.hazard);
        case 'score':
          return b.riskScore - a.riskScore;
        default:
          return 0;
      }
    });
    return arr;
  }

  const nonZeroRiskRows = sortedRiskRows().filter(
    (r) => r.impactRating > 0 && r.likelihoodRating > 0
  );
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
      {/* 说明区域Paper (可折叠) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setExplanationExpanded(!explanationExpanded)}
        >
          <Typography variant="h6">About this step</Typography>
          {explanationExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>
        <Collapse in={explanationExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              <strong>Likelihood x Impact = Risk Score</strong>
            </Typography>
            <Typography paragraph>
              <ul>
                <li>
                  Combine Impact &amp; Likelihood to get a risk score. Then
                  select the highest concerns for the next step.
                </li>
                <li>
                  Please confirm your risk prioritization, then select the rows
                  you want to highlight as final priority. Only after selecting
                  at least one will the Next Step be enabled.
                </li>
                <li>
                  Only the non-zero risk rows are shown. If you typed 0 in
                  previous steps, those get cleared.
                </li>
              </ul>
            </Typography>
          </Box>
        </Collapse>
      </Paper>
      {/* ========== 新增一段 Paper: Risk Matrix 可视化 ========== */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Risk Matrix Visualization
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Scatter Plot: X = Likelihood, Y = Impact, Dot Color = RiskScore
        </Typography>

        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Likelihood"
                domain={[0, 6]}
                tickCount={7}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Impact"
                domain={[0, 6]}
                tickCount={7}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <Paper sx={{ p: 1 }}>
                        <Typography variant="body2">
                          <strong>Hazard:</strong> {item.hazard}
                        </Typography>
                        <Typography variant="body2">
                          <strong>System:</strong> {item.systemName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>SubSystem:</strong> {item.subSystemName}
                        </Typography>
                        {/* 用 actualX/actualY 来显示真实 Likelihood/Impact */}
                        <Typography variant="body2">
                          <strong>Likelihood:</strong> {item.actualX}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Impact:</strong> {item.actualY}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Score:</strong> {item.riskScore}
                        </Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              {/* 关键: 用 shape 自定义点, 根据 riskScore 显示不同颜色 */}
              <Scatter
                name="Risks"
                data={matrixData}
                shape={<RiskDot />}
                // shape={(props) => <RiskDot {...props} />}  // 也可
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* 优先级结果区域 */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
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
          <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
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
          </Box>
        )}
      </Paper>

      {/* 按钮区: 只有selectedRisks>0 才能Next */}
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={markComplete}>
          Mark Step2 as Complete
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          component={Link}
          to="/workflow/step3"
          disabled={selectedRisks.length === 0}
        >
          Next: Step 3
        </Button>
      </Box>
    </Box>
  );
}
export default PrioritizedRisk;
