// src/pages/essentialWorkflow/step2/ImpactAssessment.jsx

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
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { EssentialWorkflowContext } from '../../../contexts/EssentialWorkflowContext';
import { Link } from 'react-router-dom';

/**
 * ImpactAssessment:
 *  - 4个Paper:
 *    1) Guide (可折叠)
 *    2) Select system (始终显示)
 *    3) System detail (只有selectedSystems>0才显示)
 *    4) Add new system/subsystem (同上)
 */
export function ImpactAssessment({ activeTabIndex }) {
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

  // Guide 展开/收起
  const [guideExpanded, setGuideExpanded] = useState(true);

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
    if (!inputValue) {
      // 用户清空
      return setImpactRatings((prev) => {
        const k = buildImpactKey(hazard, systemName, subName);
        const newObj = { ...prev };
        newObj[k] = '';
        return newObj;
      });
    }
    let val = parseInt(inputValue, 10);
    if (isNaN(val)) {
      // 用户乱输 => 当成清空
      return setImpactRatings((prev) => {
        const k = buildImpactKey(hazard, systemName, subName);
        const newObj = { ...prev };
        newObj[k] = '';
        return newObj;
      });
    }
    if (val === 0) {
      // 0 => 存在state中 0
      return setImpactRatings((prev) => {
        const k = buildImpactKey(hazard, systemName, subName);
        const newObj = { ...prev };
        newObj[k] = 0;
        return newObj;
      });
    }
    // 保持1..5
    if (val < 1) val = 1;
    if (val > 5) val = 5;
    const key = buildImpactKey(hazard, systemName, subName);
    setImpactRatings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleImpactRatingBlur(hazard, systemName, subName) {
    const key = buildImpactKey(hazard, systemName, subName);
    const rating = impactRatings[key];

    // 若是空字符串 => 不post
    if (rating === '') return;

    // rating可能是数值1..5 或者 0
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
      {/* =============== Paper #1: Guide (可折叠) =============== */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            justifyContent: 'space-between',
          }}
          onClick={() => setGuideExpanded(!guideExpanded)}
        >
          <Typography variant="h6">Guide</Typography>
          {guideExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>
        <Collapse in={guideExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              This step is built based on City of Vancouver's
              {'Resilient Building Planning Worksheet'} <br />
            </Typography>
            <Typography paragraph>
              In this step, you will: <br />
              1) choose systems to be evaluated → <br />
              2) evaluate impact on subsystem from 1~5 <br />" For each impact
              within each Impact Category, assign a consequence rating of 1 to 5
              based on the suggested scale below. <br />
              Consider both the immediate and long-term impacts of each hazard
              on each impact category. <br />
              Some hazards may cause acute or sudden impacts (""shocks""), while
              others can contribute to chronic impacts (""stressors""). "
              <br />
              1- Very low <br />
              2- Low <br />
              3- Moderate <br />
              4- High <br />
              5- Very High <br />
            </Typography>
            <Typography paragraph>
              If you'd like to clear all data, you can click the "Clear Current
              Input" below.
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* =============== Paper #2: Select system (始终显示) =============== */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Select Systems
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearImpact}
          sx={{ mb: 2 }}
        >
          Clear Current Input
        </Button>
        <Divider sx={{ mb: 2 }} />

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
      </Paper>

      {/* 只有当 selectedSystems.length>0 时，显示下面的2个 paper */}
      {selectedSystems.length > 0 && (
        <>
          {/* =============== Paper #3: System detail table =============== */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Selected Systems Detail
            </Typography>
            {filteredCategories.length === 0 ? (
              <Typography color="text.secondary">
                No systems selected yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '30%' }}>
                        System / SubSystem
                      </TableCell>
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
          </Paper>

          {/* =============== Paper #4: Add new system/subsystem =============== */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Add New System / Subsystem
            </Typography>
            <Box sx={{ mb: 2 }}>
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
            </Box>

            <Box>
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
            </Box>
          </Paper>
        </>
      )}
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

export default ImpactAssessment;
