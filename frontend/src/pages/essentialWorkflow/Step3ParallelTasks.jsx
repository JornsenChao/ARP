// frontend/src/pages/essentialWorkflow/Step3ParallelTasks.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { linkify } from '../../utils/linkify';
import DOMPurify from 'dompurify';
import DependencySelector from '../../components/DependencySelector';
import GraphViewer from '../../components/GraphViewer';
import axios from 'axios';

const DOMAIN = 'http://localhost:8000';

// 示例同义词映射
const SYNONYM_MAP = {
  coastal: ['coastal', 'oceanfront', 'marine', 'near the sea'],
  flood: [
    'flooding',
    'flood',
    'inundation',
    'deluge',
    'overflow',
    'flash flood',
    'water inundation',
  ],
  drought: [
    'drought',
    'water scarcity',
    'dry spell',
    'arid conditions',
    'water shortage',
    'prolonged dry period',
    'aridity',
  ],
  heatwave: [
    'heatwave',
    'heat wave',
    'extreme heat',
    'hot spell',
    'heat spell',
    'temperature spike',
    'hot snap',
  ],
  'sea level rise': [
    'sea level rise',
    'rising seas',
    'ocean level rise',
    'tidal rise',
    'coastal inundation',
    'marine encroachment',
    'tidal increase',
  ],
  landslide: [
    'landslide',
    'mudslide',
    'debris flow',
    'slope failure',
    'earth slide',
    'land collapse',
    'debris avalanche',
  ],

  'height limit': [
    'height limit',
    'max height',
    'height cap',
    'elevation cap',
    'building height restriction',
    'height zoning',
    'vertical restriction',
  ],
  wetland: [
    'wetland',
    'marsh',
    'bog',
    'swamp',
    'fen',
    'peatland',
    'wet meadow',
  ],

  'public building': [
    'public building',
    'civic infrastructure',
    'government facility',
    'community center',
    'municipal facility',
    'public facility',
    'civic building',
  ],
  residential: [
    'residential',
    'housing',
    'dwelling',
    'residential development',
    'living spaces',
    'residences',
    'housing project',
  ],
  'commercial complex': [
    'commercial complex',
    'retail center',
    'shopping mall',
    'business complex',
    'commercial development',
    'commercial facility',
    'retail complex',
  ],

  coastal: [
    'coastal',
    'oceanfront',
    'marine',
    'seaside',
    'shoreline',
    'littoral',
    'near the sea',
  ],
  inland: [
    'inland',
    'interior',
    'continental',
    'landlocked',
    'upland',
    'interior region',
  ],
  mountain: [
    'mountain',
    'alpine',
    'montane',
    'highland',
    'mountainous region',
    'upland',
  ],

  'small-scale site': [
    'small-scale site',
    'site-level',
    'individual site',
    'single site',
    'localized area',
    'parcel scale',
  ],
  'medium-scale site': [
    'medium-scale site',
    'building-scale',
    'structure-scale',
    'building-level',
    'mid-scale site',
    'site scale',
  ],
  'large-scale region': [
    'large-scale region',
    'regional scale',
    'campus-scale',
    'district-scale',
    'macro scale',
    'broad area',
    'large area',
  ],
};

function Step3ParallelTasks() {
  // ======== Tab state (A/B/C) ========
  const [currentTab, setCurrentTab] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(true); // 控制面板显示/隐藏

  // ============== Step3 local states ==============
  // 1) context -> dependencyData
  const [dependencyData, setDependencyData] = useState({});
  // 2) collection
  const [collection, setCollection] = useState([]);
  // ============== from step2: selectedRisks ==============
  const [selectedRiskRows, setSelectedRiskRows] = useState([]);
  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };
  // 3) tasks data
  // ============== CHANGES: 额外保存“用户输入的问题” ==============
  const [queryA, setQueryA] = useState('');
  const [docsA, setDocsA] = useState([]);
  const [queryB, setQueryB] = useState('');
  const [docsB, setDocsB] = useState([]);
  const [queryC, setQueryC] = useState('');
  const [docsC, setDocsC] = useState([]);

  // 4) tasks summary
  const [tabSummaryData, setTabSummaryData] = useState({
    A: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
      graph: null,
      graphLibrary: '',
    },
    B: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
      graph: null,
      graphLibrary: '',
    },
    C: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
      graph: null,
      graphLibrary: '',
    },
  });

  // ============== other states ==============
  const [language, setLanguage] = useState('en');
  const [framework, setFramework] = useState('');
  const [graphLibrary, setGraphLibrary] = useState('cytoscape');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded(!expanded);
  const textLenLimit = 1500;

  // =========================
  // 0) 组件初始化：从后端抓取 step3，填入本地
  // =========================
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const wfRes = await fetch(`${DOMAIN}/workflow`);
        if (!wfRes.ok) {
          throw new Error('Failed to fetch workflow');
        }
        const wfData = await wfRes.json();

        const s3 = wfData.step3 || {};

        // 1) context
        setDependencyData(s3.context || {});

        // 2) collection
        setCollection(s3.collection || []);

        // 3) taskA/B/C => data
        setDocsA(s3.taskA?.data || []);
        setDocsB(s3.taskB?.data || []);
        setDocsC(s3.taskC?.data || []);

        // 4) summaries
        setTabSummaryData({
          A: {
            isSummarizing: false,
            ...s3.taskA?.summary,
          },
          B: {
            isSummarizing: false,
            ...s3.taskB?.summary,
          },
          C: {
            isSummarizing: false,
            ...s3.taskC?.summary,
          },
        });

        // 5) CHANGES: 如果 step3.taskA.query / taskB.query / taskC.query 有的话，也回填
        if (s3.taskA?.query) setQueryA(s3.taskA.query);
        if (s3.taskB?.query) setQueryB(s3.taskB.query);
        if (s3.taskC?.query) setQueryC(s3.taskC.query);

        // 6) graphLibrary 如果某个 summary有，就取来
        const glA = s3.taskA?.summary?.graphLibrary;
        if (glA) setGraphLibrary(glA);

        // ========== step2 selected risks
        const riskRes = wfData.step2?.riskResult || [];
        const selectedRefs = wfData.step2?.selectedRisks || [];
        const matched = selectedRefs.map((ref) =>
          riskRes.find(
            (row) =>
              row.hazard === ref.hazard &&
              row.systemName === ref.systemName &&
              row.subSystemName === ref.subSystemName
          )
        );
        const validRows = matched.filter(Boolean);
        setSelectedRiskRows(validRows);
      } catch (err) {
        console.error('Error init Step3:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // =========================
  // 1) 每当本地 step3 数据变化 => 自动保存到后端
  // =========================
  const firstRenderRef = useRef(true);
  useEffect(() => {
    // 避免初次加载时马上POST覆盖
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    saveStep3ToBackend();
  }, [
    dependencyData,
    collection,
    docsA,
    docsB,
    docsC,
    tabSummaryData,
    queryA,
    queryB,
    queryC,
    graphLibrary,
  ]);
  function getSynonymMatches(docContent) {
    const lower = (docContent || '').toLowerCase();
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
  async function saveStep3ToBackend() {
    try {
      // 1) 先获取原workflow
      const wfRes = await fetch(`${DOMAIN}/workflow`);
      if (!wfRes.ok) return console.error('Failed GET /workflow');
      const oldWf = await wfRes.json();

      // 2) 构造新的 step3
      const newWf = { ...oldWf };
      if (!newWf.step3) newWf.step3 = {};

      // context
      newWf.step3.context = dependencyData;
      // collection
      newWf.step3.collection = collection;

      // taskA
      newWf.step3.taskA = newWf.step3.taskA || {};
      newWf.step3.taskA.data = docsA;
      newWf.step3.taskA.summary = {
        globalSummary: tabSummaryData.A.globalSummary || '',
        globalSources: tabSummaryData.A.globalSources || [],
        fileSummaryMap: tabSummaryData.A.fileSummaryMap || [],
        graph: tabSummaryData.A.graph || null,
        graphLibrary: tabSummaryData.A.graphLibrary || graphLibrary || '',
      };
      // CHANGES: 新增保存 query
      newWf.step3.taskA.query = queryA;

      // taskB
      newWf.step3.taskB = newWf.step3.taskB || {};
      newWf.step3.taskB.data = docsB;
      newWf.step3.taskB.summary = {
        globalSummary: tabSummaryData.B.globalSummary || '',
        globalSources: tabSummaryData.B.globalSources || [],
        fileSummaryMap: tabSummaryData.B.fileSummaryMap || [],
        graph: tabSummaryData.B.graph || null,
        graphLibrary: tabSummaryData.B.graphLibrary || graphLibrary || '',
      };
      newWf.step3.taskB.query = queryB;

      // taskC
      newWf.step3.taskC = newWf.step3.taskC || {};
      newWf.step3.taskC.data = docsC;
      newWf.step3.taskC.summary = {
        globalSummary: tabSummaryData.C.globalSummary || '',
        globalSources: tabSummaryData.C.globalSources || [],
        fileSummaryMap: tabSummaryData.C.fileSummaryMap || [],
        graph: tabSummaryData.C.graph || null,
        graphLibrary: tabSummaryData.C.graphLibrary || graphLibrary || '',
      };
      newWf.step3.taskC.query = queryC;

      // 3) POST 回后端
      const postRes = await fetch(`${DOMAIN}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWf),
      });
      if (!postRes.ok) {
        console.error('Failed to POST /workflow for step3');
      }
    } catch (err) {
      console.error('saveStep3ToBackend error:', err);
    }
  }

  // =========================
  // 2) 其余业务逻辑
  // =========================

  async function fetchSelectedRisksAndBuildRows() {
    try {
      setLoading(true);
      const wfRes = await fetch(`${DOMAIN}/workflow`);
      const wfData = await wfRes.json();

      const riskRes = wfData.step2?.riskResult || [];
      const selectedRefs = wfData.step2?.selectedRisks || [];

      const matched = selectedRefs.map((ref) =>
        riskRes.find(
          (row) =>
            row.hazard === ref.hazard &&
            row.systemName === ref.systemName &&
            row.subSystemName === ref.subSystemName
        )
      );
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

      const listRes = await axios.get(`${DOMAIN}/files/list`);
      const all = listRes.data || [];
      const filtered = all.filter(
        (f) => f.docType === targetDocType && f.storeBuilt
      );
      const fileKeys = filtered.map((f) => f.fileKey);

      const resp = await axios.post(`${DOMAIN}/multiRAG/query`, {
        fileKeys,
        dependencyData,
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
      let summaryKey = 'A';
      if (whichTab === 'A') {
        docs = docsA;
        summaryKey = 'A';
      } else if (whichTab === 'B') {
        docs = docsB;
        summaryKey = 'B';
      } else {
        docs = docsC;
        summaryKey = 'C';
      }
      if (docs.length === 0) {
        alert('No docs found, search first');
        return;
      }
      const resp = await axios.post(`${DOMAIN}/multiRAG/buildGraph`, {
        docs,
        frameworkName: framework,
      });
      const { graphData } = resp.data;

      setTabSummaryData((prev) => {
        const newVal = { ...prev };
        newVal[summaryKey] = {
          ...prev[summaryKey],
          graph: graphData,
          graphLibrary,
        };
        return newVal;
      });
    } catch (err) {
      console.error(err);
      alert('Graph error:' + err.message);
    }
  }

  function handleAddToCollection(doc) {
    setCollection((prev) => [
      ...prev,
      {
        text: doc.pageContent.slice(0, textLenLimit),
        metadata: doc.metadata,
        addedAt: new Date().toLocaleTimeString(),
      },
    ]);
  }

  async function handleSummarize(whichTab) {
    // 1) 先把 tabSummaryData 复制出来
    const newTabSummary = { ...tabSummaryData };
    // 2) 把 isSummarizing 置为 true
    newTabSummary[whichTab] = {
      ...newTabSummary[whichTab],
      isSummarizing: true,
      // 清空旧数据
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
    };
    setTabSummaryData(newTabSummary);

    try {
      // 根据当前 tab 选择要处理的 docs
      let docs = [];
      if (whichTab === 'A') docs = docsA;
      else if (whichTab === 'B') docs = docsB;
      else docs = docsC;

      if (!docs || docs.length === 0) {
        alert('No docs to summarize');
        // 复位 isSummarizing
        newTabSummary[whichTab].isSummarizing = false;
        setTabSummaryData({ ...newTabSummary });
        return;
      }

      // 调用后端的 multiRAG/summarize 接口
      const resp = await axios.post(`${DOMAIN}/multiRAG/summarize`, {
        docs,
        language,
      });
      const data = resp.data;
      console.log('[handleSummarize] summarize response:', data);

      // 后端返回形如：
      // {
      //   summary: "<global summary text>",
      //   summary_items: {
      //       "FileA.pdf": {
      //         summaryStr: "...(该文件二次整合的简要概述)...",
      //         summaryItems: [ {content:'', source:{}}, ... ],
      //         sources: [...]
      //       },
      //       "FileB.csv": { ... }
      //   },
      //   sources: [ {fileName:'', pageOrLine:''}, ... ]
      // }
      if (!data || !data.summary_items) {
        alert('No summary_items in response');
        newTabSummary[whichTab].isSummarizing = false;
        setTabSummaryData({ ...newTabSummary });
        return;
      }

      // 1) 存储全局总结 & 全局来源
      newTabSummary[whichTab].globalSummary = data.summary || '';
      newTabSummary[whichTab].globalSources = data.sources || [];

      // 2) 将 summary_items（对象形式）转换为数组，以便在前端渲染时方便 map
      // data.summary_items => { "FileName.pdf": { summaryStr, summaryItems, sources }, ... }
      if (data.summary_items && typeof data.summary_items === 'object') {
        const fileSummaryArr = Object.entries(data.summary_items).map(
          ([fn, obj]) => ({
            fileName: fn,
            summaryStr:
              typeof obj.summaryStr === 'string'
                ? obj.summaryStr
                : JSON.stringify(obj.summaryStr),
            summaryItems: Array.isArray(obj.summaryItems)
              ? obj.summaryItems
              : [],
            sources: Array.isArray(obj.sources) ? obj.sources : [],
          })
        );
        newTabSummary[whichTab].fileSummaryMap = fileSummaryArr;
      }
      // 最终更新
      newTabSummary[whichTab].isSummarizing = false;
      setTabSummaryData({ ...newTabSummary });
    } catch (err) {
      console.error('Summarize error:', err);
      alert('Summarize error: ' + err.message);
      newTabSummary[whichTab].isSummarizing = false;
      setTabSummaryData(newTabSummary);
    }
  }

  function renderTabContent(whichTab, query, setQuery, docs) {
    const summaryData = tabSummaryData[whichTab];
    const canSummarize = docs.length > 0;
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
          {/* === [New] Summary Button */}
          <Button
            variant="outlined"
            disabled={!canSummarize}
            onClick={() => handleSummarize(whichTab)}
          >
            Summary
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
        {/* === [New] 如果有摘要 */}
        {(summaryData.isSummarizing ||
          summaryData.fileSummaryMap?.length > 0 ||
          summaryData.globalSummary) && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc' }}>
            {summaryData.isSummarizing ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {/* 全局摘要 */}
                {summaryData.globalSummary && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Global Summary
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', ml: 2 }}
                    >
                      {summaryData.globalSummary}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {summaryData.fileSummaryMap?.map((fileItem, idx) => (
                  <Box key={idx} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      File: {fileItem.fileName}
                    </Typography>

                    {/* 文件级摘要 */}
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', ml: 2, mb: 1 }}
                    >
                      {fileItem.summaryStr}
                    </Typography>

                    {fileItem.summaryItems?.length > 0 && (
                      <Box sx={{ ml: 3 }}>
                        {fileItem.summaryItems.map((itm, i2) => (
                          <Box key={i2} sx={{ mb: 1 }}>
                            <div>
                              <strong>• {itm.content}</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#555' }}>
                              Source: {itm.source.fileName},{' '}
                              {itm.source.pageOrLine}
                            </div>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* 如果需要文件级source */}
                    {fileItem.sources?.length > 0 && (
                      <Box sx={{ mt: 1, ml: 3 }}>
                        <Typography variant="subtitle2">
                          File Sources:
                        </Typography>
                        {fileItem.sources.map((src, i3) => (
                          <Typography
                            key={i3}
                            variant="body2"
                            sx={{ fontSize: '0.85rem', color: '#555' }}
                          >
                            - {src.fileName}, {src.pageOrLine}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}

        {summaryData.graph && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Graph Visualization:</Typography>
            <Box sx={{ height: 400, border: '1px solid #ccc' }}>
              <GraphViewer
                library={graphLibrary}
                graphData={summaryData.graph}
              />
            </Box>
          </Box>
        )}

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Search Results:
        </Typography>
        {docs.length === 0 && <Typography>No results yet.</Typography>}

        {docs.map((doc, idx) => (
          <Card key={idx} sx={{ mb: 1, p: 1 }}>
            {/* ============== NEW: 显示 highlightLabels if any ============== */}
            {doc.highlightLabels && doc.highlightLabels.length > 0 && (
              <Box sx={{ color: 'red', fontWeight: 'bold' }}>
                Matched synonyms: {doc.highlightLabels.join(', ')}
              </Box>
            )}
            {/* CSV/XLSX chunk? */}
            {doc.metadata?.columnData ? (
              <Box>
                {doc.metadata.columnData.map((col, cidx) => {
                  const htmlVal = linkify(col.cellValue || '');
                  return (
                    <Box key={cidx} sx={{ mb: 1 }}>
                      <strong>
                        {col.colName} | {col.infoCategory} | {col.metaCategory}
                      </strong>
                      <Box
                        sx={{ ml: 2 }}
                        dangerouslySetInnerHTML={{ __html: htmlVal }}
                      />
                    </Box>
                  );
                })}
                <Typography
                  variant="body4"
                  sx={{
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                  }}
                >
                  {`Row ${doc.metadata.rowIndex} at ${doc.metadata.fileName}`}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {expanded
                  ? doc.pageContent
                  : doc.pageContent.slice(0, textLenLimit) +
                    (doc.pageContent.length > textLenLimit ? '…' : '')}
                {doc.pageContent.length > textLenLimit && (
                  <Button size="small" onClick={toggle}>
                    {expanded ? '收起' : '展开全文'}
                  </Button>
                )}
                <br />
                <Typography
                  variant="body4"
                  sx={{
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                  }}
                >
                  {`Page ${doc.metadata.page} at ${doc.metadata.fileName}`}
                </Typography>
              </Typography>
            )}

            <Button variant="text" onClick={() => handleAddToCollection(doc)}>
              + Add to Collection
            </Button>
          </Card>
        ))}
      </Box>
    );
  }

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
          Step 3: Navigate Resource
        </Typography>

        <Tabs value={currentTab} onChange={handleChangeTab} sx={{ mb: 2 }}>
          <Tab label="Task A: Case Study" />
          <Tab label="Task B: Strategy" />
          <Tab label="Task C: Other Resources" />
        </Tabs>

        {currentTab === 0 && renderTabContent('A', queryA, setQueryA, docsA)}
        {currentTab === 1 && renderTabContent('B', queryB, setQueryB, docsB)}
        {currentTab === 2 && renderTabContent('C', queryC, setQueryC, docsC)}
      </Box>

      {/* 右侧: 用三折叠面板 (ProjectContext, SelectedRisks, CurrentCollection) */}
      <Box
        sx={{
          width: isPanelOpen ? 300 : 20, // 展开时宽度为300px，隐藏时宽度为40px
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #ccc',
          height: '100vh',
          mt: 8,
          transition: 'width 0.3s ease', // 添加动画效果
          position: 'relative', // 使按钮可以固定在面板边缘
        }}
      >
        {/* 切换按钮 */}
        <Button
          onClick={togglePanel}
          sx={{
            position: 'absolute',
            top: 10,
            left: isPanelOpen ? -20 : 0, // 根据面板状态调整按钮位置
            minWidth: 'unset',
            width: 20,
            height: 40,
            zIndex: 10,
            borderRadius: '0 4px 4px 0',
            backgroundColor: '#f0f0f0',
            '&:hover': { backgroundColor: '#e0e0e0' },
          }}
        >
          {isPanelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>

        {isPanelOpen && (
          <>
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
                    value={dependencyData}
                    onChange={(data) => setDependencyData(data)}
                  />
                </AccordionDetails>
              </Accordion>

              <Divider />

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Selected Risks (from Step2)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedRiskRows.length === 0 ? (
                    <Typography>No risk selected or all are zero.</Typography>
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

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Current Collection</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {collection.length === 0 ? (
                    <Typography>No items yet.</Typography>
                  ) : (
                    <List dense>
                      {collection.map((item, idx) => (
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
          </>
        )}
      </Box>
    </Box>
  );
}

export default Step3ParallelTasks;
