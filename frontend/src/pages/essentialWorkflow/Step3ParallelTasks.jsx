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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { linkify } from '../../utils/linkify';
// import ExpandableText from '../../components/ExpandableText';
import DOMPurify from 'dompurify';
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
  const [isPanelOpen, setIsPanelOpen] = useState(true); // 控制面板显示/隐藏
  // ======== common RAG states ========
  const [dependencyData, setDependencyData] = useState({});
  const [collection, setCollection] = useState([]);

  // ======== step2 "selectedRisks" -> 这里我们要匹配 riskResultRow ========
  const [selectedRiskRows, setSelectedRiskRows] = useState([]);
  const togglePanel = () => {
    setIsPanelOpen((prev) => !prev);
  };
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
  const [tabSummaryData, setTabSummaryData] = useState({
    A: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
    },
    B: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
    },
    C: {
      isSummarizing: false,
      globalSummary: '',
      globalSources: [],
      fileSummaryMap: [],
    },
  });
  const [language, setLanguage] = useState('en');
  const [framework, setFramework] = useState('');
  const [graphLibrary, setGraphLibrary] = useState('cytoscape');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded(!expanded);
  const textLenLimit = 1500;

  // 用来表示“是否正在调用后端summarize”
  const [isSummarizing, setIsSummarizing] = useState(false);

  // 存放“跨文件”的最终顶层摘要字符串
  const [globalSummary, setGlobalSummary] = useState('');
  // 存放“跨文件”的所有来源
  const [globalSources, setGlobalSources] = useState([]);
  // 存放“各文件”的摘要结果数组
  const [fileSummaryMap, setFileSummaryMap] = useState([]);

  // const [summaryText, setSummaryText] = useState(''); // 生成的 Summarize 结果
  const [fileSummaries, setFileSummaries] = useState([]);
  const [allSources, setAllSources] = useState([]);
  // const [summaryItems, setSummaryItems] = useState([]);
  // const [summarySources, setSummarySources] = useState([]);
  // const [doc, setDoc] = useState({ pageContent: '' });
  // const fullText = doc.pageContent || '';
  // const previewText = fullText.slice(0, 1000);
  // const showToggle = fullText.length > 1000;

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
  function renderChunkContent(rawText) {
    // 1) 调用 linkify
    const replaced = linkify(rawText);
    // 2) 再做 DOMPurify 清理
    const safeHtml = DOMPurify.sanitize(replaced);
    // 3) dangerouslySetInnerHTML
    return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
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

  // ======== Add to Collection ========
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
  // === [New] Summarize: 收集“当前Tab docs” 或所有Tab docs？ 这里先演示只针对“当前Tab”
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
      // 出错也要复位
      const updated = { ...tabSummaryData };
      updated[whichTab].isSummarizing = false;
      setTabSummaryData(updated);
    }
  }
  // ======== Render tab content ========
  const renderTabContent = (whichTab, query, setQuery, docs, graph) => {
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
          summaryData.fileSummaryMap.length > 0) && (
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

                {/* 分文件显示 */}
                {summaryData.fileSummaryMap.map((fileItem, idx) => (
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

                    {/* chunk-level items */}
                    {fileItem.summaryItems &&
                      fileItem.summaryItems.length > 0 && (
                        <Box sx={{ ml: 3 }}>
                          {fileItem.summaryItems.map((itm, i2) => (
                            <Box key={i2} sx={{ mb: 1 }}>
                              <div>
                                <strong>• {itm.content}</strong>
                              </div>
                              <div
                                style={{ fontSize: '0.85rem', color: '#555' }}
                              >
                                Source: {itm.source.fileName},{' '}
                                {itm.source.pageOrLine}
                              </div>
                            </Box>
                          ))}
                        </Box>
                      )}

                    {/* 如果需要文件级source */}
                    {fileItem.sources && fileItem.sources.length > 0 && (
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
        {/* Graph */}
        {graph && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Graph Visualization:</Typography>
            <Box sx={{ height: 400, border: '1px solid #ccc' }}>
              <GraphViewer library={graphLibrary} graphData={graph} />
            </Box>
          </Box>
        )}
        {/* Results */}
        <Typography variant="subtitle1">Search Results:</Typography>
        {docs.length === 0 && <Typography>No results yet.</Typography>}
        {docs.map((doc, idx) => (
          <Card key={idx} sx={{ mb: 1, p: 1 }}>
            {/* {renderChunkContent(doc.pageContent)} */}
            {/* 1) 同义词匹配 highlight */}
            {doc.highlightLabels && doc.highlightLabels.length > 0 && (
              <Box sx={{ color: 'red', fontWeight: 'bold' }}>
                Matched synonyms: {doc.highlightLabels.join(', ')}
              </Box>
            )}

            {/* 2) 如果是 CSV/XLSX chunk, metadata.columnData 存在 => 列名+info/meta */}
            {doc.metadata?.columnData ? (
              <Box>
                {doc.metadata.columnData.map((col, cidx) => {
                  // 把 col.cellValue 里的链接 转成 <a>  (linkify)
                  // linkify 返回带 <a> 的HTML => dangerouslySetInnerHTML
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
              </Box>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {expanded
                  ? doc.pageContent
                  : doc.pageContent.slice(0, textLenLimit) +
                    (doc.pageContent.length > textLenLimit ? '…' : '')}
                {/* {fullText.slice(0, textLenLimit)}... */}

                {doc.pageContent.length > textLenLimit && (
                  <Button size="small" onClick={toggle}>
                    {expanded ? '收起' : '展开全文'}
                  </Button>
                )}
              </Typography>
            )}

            <Button variant="text" onClick={() => handleAddToCollection(doc)}>
              + Add to Collection
            </Button>
          </Card>
        ))}
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
                    <Typography>
                      No risk selected or all are zeroed out.
                    </Typography>
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

              {/* (3) Current Collection */}
              <Accordion>
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
