// frontend/src/pages/essentialWorkflow/Step3ParallelTasks.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import DependencySelector from '../../components/DependencySelector';
import GraphViewer from '../../components/GraphViewer';
import axios from 'axios';

// 后端地址，如你的后端在 8000 端口
const DOMAIN = 'http://localhost:8000';

/**
 * Step3 需求：
 * - 右侧固定两块：Project Context + Current Summary
 * - 左侧三Tab(A/B/C)各一个 query window => "Ask" => RAG
 * - 显示结果 => 每条可 "Add to Summary"
 * - "Build Graph" => 调 /multiRAG/buildGraph => 显示 Graph
 *
 * 依赖:
 *   1) DependencySelector (模仿 RAG: collects "dependencyData")
 *   2) GraphViewer (already from RAG project)
 */
function Step3ParallelTasks() {
  // ======== ProjectContext: from DependencySelector ========
  const [dependencyData, setDependencyData] = useState({});
  // ======== Summary: user-chosen result chunks ========
  const [summary, setSummary] = useState([]);

  // ======== Tab state ========
  const [currentTab, setCurrentTab] = useState(0);

  // 为了演示，分别存放每个Tab的查询 & 返回docs & GraphData
  // A
  const [queryA, setQueryA] = useState('');
  const [docsA, setDocsA] = useState([]);
  const [graphA, setGraphA] = useState(null);

  // B
  const [queryB, setQueryB] = useState('');
  const [docsB, setDocsB] = useState([]);
  const [graphB, setGraphB] = useState(null);

  // C
  const [queryC, setQueryC] = useState('');
  const [docsC, setDocsC] = useState([]);
  const [graphC, setGraphC] = useState(null);

  // 下拉选择(语言 / framework?)
  const [language, setLanguage] = useState('en');
  const [framework, setFramework] = useState('');
  const [graphLibrary, setGraphLibrary] = useState('cytoscape');
  // loading indicator
  const [loading, setLoading] = useState(false);

  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // ======== RAG Search (MultiRAG) for a given tab ========
  async function handleAskRAG(whichTab) {
    setLoading(true);
    try {
      // 1) pick query & setDocs
      let query = '';
      if (whichTab === 'A') query = queryA;
      else if (whichTab === 'B') query = queryB;
      else query = queryC;
      if (!query.trim()) {
        alert('Please type a query');
        setLoading(false);
        return;
      }

      // 2) call /multiRAG/query
      const resp = await axios.post(`${DOMAIN}/multiRAG/query`, {
        fileKeys: [],
        dependencyData, // from right side
        userQuery: query,
        language,
        customFields: [],
      });
      const { docs = [] } = resp.data || {};

      // 3) store in state
      if (whichTab === 'A') setDocsA(docs);
      else if (whichTab === 'B') setDocsB(docs);
      else setDocsC(docs);
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ======== Add to Summary ========
  function handleAddToSummary(doc) {
    // doc.pageContent...
    // 这里简单存 { text: doc.pageContent }
    setSummary((prev) => [
      ...prev,
      {
        text: doc.pageContent.slice(0, 100), //截断
        metadata: doc.metadata,
        addedAt: new Date().toLocaleTimeString(),
      },
    ]);
  }

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
        frameworkName: framework, // e.g. "AIA"
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

  // ======== Render sub steps ========
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
        {/* Render docs */}
        <Box>
          <Typography variant="subtitle1">Search Results:</Typography>
          {docs.length === 0 && <Typography>No results yet.</Typography>}
          {docs.map((doc, idx) => (
            <Card key={idx} sx={{ mb: 1, p: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {doc.pageContent?.slice(0, 200)}...
              </Typography>
              <Button
                variant="text"
                onClick={() => handleAddToSummary(doc)}
                sx={{ mt: 1 }}
              >
                + Add to Summary
              </Button>
            </Card>
          ))}
        </Box>
        {/* Render Graph */}
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

      {/* 右侧: Project Context + Current Summary */}
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
        {/* Project Context */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          <Typography variant="h6">Project Context</Typography>
          <DependencySelector onChange={(data) => setDependencyData(data)} />
        </Box>
        <Divider />
        {/* Current Summary */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          <Typography variant="h6">Current Summary</Typography>
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
        </Box>
      </Box>
    </Box>
  );
}

export default Step3ParallelTasks;
