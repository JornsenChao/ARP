// frontend/src/pages/essentialWorkflow/Step3ParallelTasks.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DependencySelector from '../../components/DependencySelector';
import GraphViewer from '../../components/GraphViewer';
import axios from 'axios';

const DOMAIN = 'http://localhost:8000';

const SYNONYM_MAP = {
  coastal: ['coastal', 'oceanfront', 'marine', 'near the sea'],
  flood: ['flood', 'inundation'],
  // ...
};

function highlightSynonyms(text, sideContextKeys) {
  // sideContextKeys: e.g. ['coastal','flood'] from user selection
  // expand with synonyms
  let allKeys = new Set();
  sideContextKeys.forEach((k) => {
    allKeys.add(k);
    if (synonyms[k]) {
      synonyms[k].forEach((syn) => allKeys.add(syn));
    }
  });
  // naive implementation: replace them ignoring case
  let result = text;
  allKeys.forEach((term) => {
    const re = new RegExp(`\\b(${term})\\b`, 'gi');
    result = result.replace(re, `<mark>$1</mark>`);
  });
  return result;
}

function Step3ParallelTasks() {
  // ======== Tab state (A/B/C) ========
  const [currentTab, setCurrentTab] = useState(0);

  // ======== common RAG states ========
  const [dependencyData, setDependencyData] = useState({});
  const [summary, setSummary] = useState([]);

  // ======== step2 "selectedRisks" -> 这里我们要匹配 riskResultRow ========
  const [selectedRiskRows, setSelectedRiskRows] = useState([]);

  // For queries in each tab
  const [queryA, setQueryA] = useState('');
  const [docsA, setDocsA] = useState([]);
  const [graphA, setGraphA] = useState(null);

  const [queryB, setQueryB] = useState('');
  const [docsB, setDocsB] = useState([]);
  const [graphB, setGraphB] = useState(null);

  const [queryC, setQueryC] = useState('');
  const [docsC, setDocsC] = useState([]);
  const [graphC, setGraphC] = useState(null);

  const [language, setLanguage] = useState('en');
  const [framework, setFramework] = useState('');
  const [graphLibrary, setGraphLibrary] = useState('cytoscape');
  const [loading, setLoading] = useState(false);
  function getDocTypeForTab(whichTab) {
    if (whichTab === 'A') return 'caseStudy';
    if (whichTab === 'B') return 'strategy';
    return 'otherResource';
  }
  function getSynonymMatches(docContent) {
    const lower = docContent.toLowerCase();
    const found = [];
    Object.entries(SYNONYM_MAP).forEach(([label, synonyms]) => {
      for (const s of synonyms) {
        if (lower.includes(s)) {
          found.push(label);
          break; // 找到一个同义词就够了
        }
      }
    });
    return found;
  }
  /**
   * 一进 Step3，或后续想刷新时，都可以获取 workflow
   * -> 读 step2.selectedRisks[] (仅 references)
   * -> 读 step2.riskResult[] (最新score)
   * -> 对应匹配 => build selectedRiskRows
   */
  useEffect(() => {
    fetchSelectedRisksAndBuildRows();
  }, []);

  async function fetchSelectedRisksAndBuildRows() {
    try {
      setLoading(true);
      const wfRes = await fetch(`${DOMAIN}/workflow`);
      const wfData = await wfRes.json();

      // step2.riskResult
      const riskRes = wfData.step2?.riskResult || [];
      // step2.selectedRisks: [{hazard, systemName, subSystemName}, ...]
      const selectedRefs = wfData.step2?.selectedRisks || [];

      // 用 selectedRefs 去匹配 riskRes 里的行
      // 这样就能拿到最新的 impact/likelihood/riskScore
      const matched = selectedRefs.map((ref) => {
        return riskRes.find(
          (row) =>
            row.hazard === ref.hazard &&
            row.systemName === ref.systemName &&
            row.subSystemName === ref.subSystemName
        );
      });
      // 过滤掉 null/undefined
      const validRows = matched.filter(Boolean);

      setSelectedRiskRows(validRows);
    } catch (err) {
      console.error('Error loading selected risks', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };
  /**
   * 1) 先拿 /files/list => 过滤出 docType=xxx => fileKeys
   */
  const getFileKeysByDocType = async (docTypeName) => {
    try {
      const res = await axios.get(`${DOMAIN}/files/list`);
      const all = res.data || [];
      const filtered = all.filter(
        (f) => f.docType === docTypeName && f.storeBuilt
      );
      return filtered.map((f) => f.fileKey);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  /**
   * 2) handleAskRAG: 先拿 fileKeys (by docType),
   *   再 multiRAG/query
   */
  const handleAskRAG = async (whichTab) => {
    setLoading(true);
    try {
      let query = '';
      let targetDocType = 'otherResource';
      if (whichTab === 'A') {
        query = queryA;
        targetDocType = 'caseStudy';
      } else if (whichTab === 'B') {
        query = queryB;
        targetDocType = 'strategy';
      } else {
        query = queryC;
        targetDocType = 'otherResource';
      }

      if (!query.trim()) {
        alert('Please type a query');
        setLoading(false);
        return;
      }

      // 先 get fileKeys by docType
      const fileKeys = await getFileKeysByDocType(targetDocType);
      console.log('fileKeys', fileKeys);
      console.log('targetDocType', targetDocType);

      // call multiRAG
      const resp = await axios.post(`${DOMAIN}/multiRAG/query`, {
        fileKeys,
        dependencyData, // optional, depends on your backend
        userQuery: query,
        language,
        customFields: [],
        docType: targetDocType,
      });
      const { docs = [] } = resp.data || [];

      // 做同义词匹配
      const annotatedDocs = docs.map((doc) => {
        const highlightLabels = getSynonymMatches(doc.pageContent);
        return { ...doc, highlightLabels };
      });

      if (whichTab === 'A') setDocsA(annotatedDocs);
      else if (whichTab === 'B') setDocsB(annotatedDocs);
      else setDocsC(annotatedDocs);
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======== Build Graph ========
  async function handleBuildGraph(whichTab) {
    try {
      let docs = [];
      if (whichTab === 'A') docs = docsA;
      else if (whichTab === 'B') docs = docsB;
      else docs = docsC;

      if (docs.length === 0) {
        alert('No docs found, search first');
        return;
      }
      const resp = await axios.post(`${DOMAIN}/multiRAG/buildGraph`, {
        docs,
        frameworkName: framework,
      });
      const { graphData } = resp.data;
      if (whichTab === 'A') setGraphA(graphData);
      else if (whichTab === 'B') setGraphB(graphData);
      else setGraphC(graphData);
    } catch (err) {
      console.error(err);
      alert('Graph error:' + err.message);
    }
  }

  // ======== Add to Summary ========
  function handleAddToSummary(doc) {
    setSummary((prev) => [
      ...prev,
      {
        text: doc.pageContent.slice(0, 100),
        metadata: doc.metadata,
        addedAt: new Date().toLocaleTimeString(),
      },
    ]);
  }

  // ======== Render tab content ========
  const renderTabContent = (whichTab, query, setQuery, docs, graph) => {
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Enter your query"
            multiline
            rows={2}
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={() => handleAskRAG(whichTab)}>
            Ask
          </Button>
          <Button variant="outlined" onClick={() => handleBuildGraph(whichTab)}>
            Build Graph
          </Button>
          <FormControl size="small">
            <InputLabel>Language</InputLabel>
            <Select
              label="Language"
              value={language}
              sx={{ width: 120 }}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="es">Español</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Framework</InputLabel>
            <Select
              label="Framework"
              value={framework}
              sx={{ width: 120 }}
              onChange={(e) => setFramework(e.target.value)}
            >
              <MenuItem value="">(none)</MenuItem>
              <MenuItem value="AIA">AIA</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Graph Lib</InputLabel>
            <Select
              label="Graph Lib"
              value={graphLibrary}
              sx={{ width: 150 }}
              onChange={(e) => setGraphLibrary(e.target.value)}
            >
              <MenuItem value="cytoscape">Cytoscape</MenuItem>
              <MenuItem value="d3Force">D3 Force</MenuItem>
              <MenuItem value="ReactForceGraph3d">3D ForceGraph</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {/* Results */}
        <Typography variant="subtitle1">Search Results:</Typography>
        {docs.length === 0 && <Typography>No results yet.</Typography>}
        {docs.map((doc, idx) => (
          <Card key={idx} sx={{ mb: 1, p: 1 }}>
            {/* 1) 同义词匹配 highlight */}
            {doc.highlightLabels && doc.highlightLabels.length > 0 && (
              <Box sx={{ color: 'red', fontWeight: 'bold' }}>
                Matched synonyms: {doc.highlightLabels.join(', ')}
              </Box>
            )}

            {/* 2) 如果是 CSV/XLSX chunk, metadata.columnData 存在 => 列名+info/meta */}
            {doc.metadata?.columnData ? (
              <Box>
                {doc.metadata.columnData.map((col, cidx) => (
                  <Box key={cidx} sx={{ mb: 1 }}>
                    <strong>
                      {col.colName} | {col.infoCategory} | {col.metaCategory}
                    </strong>
                    : {col.cellValue}
                  </Box>
                ))}
              </Box>
            ) : (
              // 对于 pdf/txt chunk, 可能没 columnData
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {doc.pageContent.slice(0, 300)}...
              </Typography>
            )}

            <Button variant="text" onClick={() => handleAddToSummary(doc)}>
              + Add to Summary
            </Button>
          </Card>
        ))}
        {/* Graph */}
        {graph && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Graph Visualization:</Typography>
            <Box sx={{ height: 400, border: '1px solid #ccc' }}>
              <GraphViewer library={graphLibrary} graphData={graph} />
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 左侧 main content */}
      <Box
        sx={{
          flex: 1,
          borderRight: '1px solid #ccc',
          height: '100vh',
          overflowY: 'auto',
          p: 2,
          mt: 8,
        }}
      >
        <Toolbar />
        <Typography variant="h5" gutterBottom>
          Step 3: Parallel Tasks (A/B/C)
        </Typography>

        <Tabs value={currentTab} onChange={handleChangeTab} sx={{ mb: 2 }}>
          <Tab label="Task A: Case Study" />
          <Tab label="Task B: Strategy" />
          <Tab label="Task C: Other Resources" />
        </Tabs>

        {currentTab === 0 &&
          renderTabContent('A', queryA, setQueryA, docsA, graphA)}
        {currentTab === 1 &&
          renderTabContent('B', queryB, setQueryB, docsB, graphB)}
        {currentTab === 2 &&
          renderTabContent('C', queryC, setQueryC, docsC, graphC)}
      </Box>

      {/* 右侧: 用三折叠面板 (ProjectContext, SelectedRisks, CurrentSummary) */}
      <Box
        sx={{
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #ccc',
          height: '100vh',
          mt: 8,
        }}
      >
        <Toolbar />

        {loading && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {/* (1) Project Context */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Project Context</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <DependencySelector
                onChange={(data) => setDependencyData(data)}
              />
            </AccordionDetails>
            {/* </Accordion> */}

            <Divider />

            {/* <Accordion defaultExpanded> */}
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Current Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* show the user current dependencyData */}
              <Typography variant="subtitle4">Climate Risks:</Typography>
              <List dense>
                {dependencyData.climateRisks?.values?.map((val) => (
                  <ListItem key={val} disableGutters>
                    <ListItemText primary={val} />
                  </ListItem>
                ))}
              </List>
              {/* <Typography variant="caption">
                Type: {dependencyData.climateRisks?.type}
              </Typography> */}
              {/* Similarly for regulations, projectTypes, environment, scale */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Regulations:</Typography>
              <List dense>
                {dependencyData.regulations?.values?.map((val) => (
                  <ListItem key={val} disableGutters>
                    <ListItemText primary={val} />
                  </ListItem>
                ))}
              </List>
              {/* <Typography variant="caption">
                Type: {dependencyData.regulations?.type}
              </Typography> */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Project Types:</Typography>
              <List dense>
                {dependencyData.projectTypes?.values?.map((val) => (
                  <ListItem key={val} disableGutters>
                    <ListItemText primary={val} />
                  </ListItem>
                ))}
              </List>
              {/* <Typography variant="caption">
                Type: {dependencyData.projectTypes?.type}
              </Typography> */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Environment:</Typography>
              <List dense>
                {dependencyData.environment?.values?.map((val) => (
                  <ListItem key={val} disableGutters>
                    <ListItemText primary={val} />
                  </ListItem>
                ))}
              </List>
              {/* <Typography variant="caption">
                Type: {dependencyData.environment?.type}
              </Typography> */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Scale:</Typography>
              <List dense>
                {dependencyData.scale?.values?.map((val) => (
                  <ListItem key={val} disableGutters>
                    <ListItemText primary={val} />
                  </ListItem>
                ))}
              </List>
              {/* <Typography variant="caption">
                Type: {dependencyData.scale?.type}
              </Typography> */}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Other Info:</Typography>
              <Typography variant="body2">
                {dependencyData.additional || '(none)'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* ========== 新增：显示自定义字段 otherData ========== */}
              <Typography variant="subtitle2">Custom Fields:</Typography>
              {/* 如果没有任何自定义字段 */}
              {Object.keys(dependencyData.otherData || {}).length === 0 ? (
                <Typography variant="body2">(none)</Typography>
              ) : (
                // 遍历 each fieldName => array of string
                Object.entries(dependencyData.otherData).map(
                  ([fieldName, arrOfVals]) => (
                    <div key={fieldName} style={{ marginTop: '0.5rem' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {fieldName}
                      </Typography>
                      {arrOfVals?.length > 0 ? (
                        <List dense>
                          {arrOfVals.map((val) => (
                            <ListItem key={val} disableGutters>
                              <ListItemText primary={val} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          (no values)
                        </Typography>
                      )}
                    </div>
                  )
                )
              )}
            </AccordionDetails>
          </Accordion>

          <Divider />

          {/* (2) Selected Risks */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Selected Risks (from Step2)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {selectedRiskRows.length === 0 ? (
                <Typography>No risk selected or all are zeroed out.</Typography>
              ) : (
                <List dense>
                  {selectedRiskRows.map((r, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={`${r.hazard} / ${r.systemName} / ${r.subSystemName}`}
                        secondary={`Impact=${r.impactRating}, Likelihood=${r.likelihoodRating}, Score=${r.riskScore}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {/* 还可加个“Refresh”按钮：重新获取step2最新 */}
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
                onClick={fetchSelectedRisksAndBuildRows}
              >
                Refresh
              </Button>
            </AccordionDetails>
          </Accordion>

          <Divider />

          {/* (3) Current Summary */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Current Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {summary.length === 0 ? (
                <Typography>No items yet.</Typography>
              ) : (
                <List dense>
                  {summary.map((item, idx) => (
                    <ListItem key={idx}>
                      <ListItemText
                        primary={item.text}
                        secondary={`Added at ${item.addedAt}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </Box>
  );
}

export default Step3ParallelTasks;
