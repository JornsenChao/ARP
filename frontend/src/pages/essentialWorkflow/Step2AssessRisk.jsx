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

/**
 * Step2AssessRisk.jsx
 *   - 仍是3个子部分(ImpactAssessment / LikelihoodAssessment / PrioritizedRisk)，
 *     但每个子组件不会被卸载，而是用 hidden 显示/隐藏
 *     保证不会丢失子组件的本地 state (例如用户已输入的表单信息)。
 *
 * 额外需求：
 *   1) ImpactAssessment 中 1~5 输入 + 颜色区分
 *   2) 当切换tab或点击 next step 再回来时，保留已填的数据
 *   3) 第三子步骤 riskScore 显示颜色(仿heatmap)
 */

function Step2AssessRisk() {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const [currentTab, setCurrentTab] = useState(0);

  // 切换到下一个子步骤时，带 confirm
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

      {/* 这里使用 Tabs，但通过 hidden 来控制显示，从而不卸载子组件 */}
      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 2 }}
      >
        <Tab label="1) Impact Assessment" />
        <Tab label="2) Likelihood" />
        <Tab label="3) Prioritized Risk" />
      </Tabs>

      {/* Tab Panels: 保持挂载，使用 hidden 属性 */}
      <Box hidden={currentTab !== 0}>
        <ImpactAssessment onNextSubStep={() => goToNextSubStep(1)} />
      </Box>
      <Box hidden={currentTab !== 1}>
        <LikelihoodAssessment onNextSubStep={() => goToNextSubStep(2)} />
      </Box>
      <Box hidden={currentTab !== 2}>
        <PrioritizedRisk />
      </Box>
    </Box>
  );
}

export default Step2AssessRisk;

/* 
  ==============================================
   (A) Impact Assessment
  ==============================================
*/
function ImpactAssessment({ onNextSubStep }) {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState.step1.hazards || [];

  // 后端返回的 { systemName, subSystems: [{name,...}], ...}
  const [impactCategories, setImpactCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // 存储用户已选中的 systems（只显示这些 system 的子系统行）
  const [selectedSystems, setSelectedSystems] = useState([]);

  // 本地保存 “hazard-systemName-subSystemName -> rating” 映射，便于回显
  // key可用 `${hazard}::${systemName}::${subName}`
  const [impactRatings, setImpactRatings] = useState({});

  // 新增系统 / 子系统
  const [newSystemName, setNewSystemName] = useState('');
  const [selectedSystemForSub, setSelectedSystemForSub] = useState('');
  const [newSubSystemName, setNewSubSystemName] = useState('');

  // 1) 初次加载: 获取 categories & 获取当前已存在的impactData, 构建 impactRatings
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

  // 拉取整个 workflowState.step2.impactData，构建本地 rating map
  async function buildLocalRatingsFromServer() {
    try {
      const resp = await fetch('http://localhost:8000/workflow');
      const fullState = await resp.json();
      // 这里的 step2.impactData: [ { hazard, systemName, subSystemName, impactRating }, ... ]
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

  // 构造 key
  function buildImpactKey(hazard, systemName, subName) {
    return `${hazard}::${systemName}::${subName}`;
  }

  // ================= 勾选 Systems =====================
  function handleToggleSystem(systemName) {
    setSelectedSystems((prev) => {
      if (prev.includes(systemName)) {
        return prev.filter((s) => s !== systemName);
      } else {
        return [...prev, systemName];
      }
    });
  }

  // ================= 保存 impact rating =====================
  // 限定1~5 + 颜色
  function handleImpactRatingChange(hazard, systemName, subName, inputValue) {
    // clamp
    let val = parseInt(inputValue, 10);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 5) val = 5;

    const key = buildImpactKey(hazard, systemName, subName);
    setImpactRatings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleImpactRatingBlur(hazard, systemName, subName) {
    // 当用户离开输入框后，再把本地数值写到后端
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

  // 用于给 1~5 rating 显示不同颜色(示例)
  function getImpactBgColor(r) {
    // 你也可自定义颜色梯度，这里简单区分
    switch (r) {
      case 1:
        return '#c8e6c9'; // 绿色
      case 2:
        return '#dcedc8';
      case 3:
        return '#ffecb3'; // 黄色
      case 4:
        return '#ffd54f';
      case 5:
        return '#ffcdd2'; // 红
      default:
        return 'transparent';
    }
  }

  // =========== Add System ============
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

  // =========== Add SubSystem ============
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

  // =========== 渲染 ================
  if (!hazards.length) {
    return <Typography>No hazards found. Please go back to Step1.</Typography>;
  }
  if (loadingCats) {
    return <Typography>Loading system & subSystem data...</Typography>;
  }

  // 过滤只显示选中的 system
  const filteredCategories = impactCategories.filter((sys) =>
    selectedSystems.includes(sys.systemName)
  );

  return (
    <Box>
      <Typography variant="h6">High Level Impact Assessment</Typography>
      <Typography paragraph>
        1) 先勾选要关注的系统 → 2) 针对子系统输入 1~5 的 ImpactRating
      </Typography>

      {/* ============  勾选系统  ============ */}
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

      {/* ============  表格：仅显示选中的 system  ============ */}
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

      {/* ============  Add System / Subsystem  ============ */}
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

      {/* ============  “Next Sub Step” 按钮  ============ */}
      <Button variant="contained" onClick={onNextSubStep}>
        Next Sub Step
      </Button>
    </Box>
  );
}

/**
 * SystemRow: 显示单个 system (可点击展开其 subSystems)
 */
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
              const val = impactRatings[key] || ''; // 如果还没输入过，就显示空

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
                    inputProps={{
                      min: 1,
                      max: 5,
                    }}
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
  ==============================================
   (B) Likelihood Assessment
  ==============================================
*/
function LikelihoodAssessment({ onNextSubStep }) {
  const { workflowState } = useContext(EssentialWorkflowContext);
  const hazards = workflowState.step1.hazards || [];

  // 类似 impactRatings，这里也需要本地 likelihoodMap
  const [likelihoodMap, setLikelihoodMap] = useState({});

  useEffect(() => {
    buildLocalLikelihoodFromServer();
    // eslint-disable-next-line
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
  ==============================================
   (C) Prioritized Risk
  ==============================================
*/
function PrioritizedRisk() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );
  const [riskResult, setRiskResult] = useState([]);
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    fetchRisk();
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

  // 给 riskScore 做个heatmap效果
  function getRiskColor(score) {
    // Impact×Likelihood => 1..25
    // 这里做简单离散：1-5,6-10,11-15,16-20,21-25
    if (score <= 5) return '#c8e6c9'; // 绿
    if (score <= 10) return '#dcedc8';
    if (score <= 15) return '#fff9c4'; // 黄
    if (score <= 20) return '#ffe082';
    return '#ffcdd2'; // 红
  }

  async function markComplete() {
    try {
      const res = await fetch('http://localhost:8000/workflow/step2/complete', {
        method: 'POST',
      });
      const data = await res.json();
      console.log('Step2 completed', data);
      // 同步更新上下文
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
