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
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';

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
          <Typography variant="h6">Explanation / Guidelines</Typography>
          {explanationExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>
        <Collapse in={explanationExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              If any sub-step is empty, or result is all zeros ... Only the
              non-zero risk rows are shown. If you typed 0 in previous steps,
              those get cleared.
            </Typography>
            <Typography paragraph>
              Please confirm your risk prioritization, then select the rows you
              want to highlight as final priority. Only after selecting at least
              one will the Next Step be enabled.
            </Typography>
          </Box>
        </Collapse>
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
          <TableContainer>
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
