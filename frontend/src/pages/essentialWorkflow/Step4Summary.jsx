// frontend/src/pages/essentialWorkflow/Step4Summary.jsx

import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Toolbar,
  Paper,
  TextField,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Select,
  MenuItem,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';

import StepProgressBar from './StepProgressBar'; // <--- 1) 引入进度条组件
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Media } from 'docx';

import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';
import { API_BASE as DOMAIN } from '../../utils/apiBase';
import { getSessionId } from '../../utils/sessionId';

import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from 'recharts';

const colors = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#d84f52',
  '#6a9cf3',
  '#a2e1d4',
  '#dba6f3',
  '#29cae4',
];

// =========== parseYear / aggregator =============
function parseYear(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  const y = d.getFullYear();
  return y >= 1800 && y <= 2100 ? y : null;
}
function buildMultiHazardYearData(hazards, femaRecords) {
  if (!hazards || hazards.length === 0) return [];
  let minY = 9999,
    maxY = 0;
  const freqMaps = {};
  hazards.forEach((hz) => {
    freqMaps[hz] = {};
  });
  femaRecords.forEach((r) => {
    if (!r.incidentType) return;
    if (!hazards.includes(r.incidentType)) return;
    const y = parseYear(r.incidentBeginDate);
    if (y) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      freqMaps[r.incidentType][y] = (freqMaps[r.incidentType][y] || 0) + 1;
    }
  });
  if (minY > maxY) return [];
  const arr = [];
  for (let y = minY; y <= maxY; y++) {
    const row = { year: String(y) };
    hazards.forEach((hz) => {
      row[hz] = freqMaps[hz][y] || 0;
    });
    arr.push(row);
  }
  return arr;
}

function riskCellColor(score) {
  if (!score) return 'transparent';
  if (score <= 5) return '#c8e6c9';
  if (score <= 10) return '#fff9c4';
  if (score <= 15) return '#ffd54f';
  if (score <= 20) return '#ffccbc';
  return '#ffcdd2';
}

// docKey: combine fileName + page/row + hash of content for uniqueness
function getDocKey(doc) {
  const fn = doc.metadata?.fileName || 'unknownFile';
  const page = doc.metadata?.page ?? '';
  const rowIdx = doc.metadata?.rowIndex ?? '';
  const content = doc.pageContent || doc.text || '';
  const contentHash = content.split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
  return `${fn}||p${page}||r${rowIdx}||${contentHash}`;
}

export default function Step4Summary() {
  const { workflowState, setWorkflowState } = useContext(
    EssentialWorkflowContext
  );

  // step4 local states
  const [overallConclusion, setOverallConclusion] = useState('');
  const [hazardReasons, setHazardReasons] = useState({});
  const [collectionSummary, setCollectionSummary] = useState('');
  const [bottomReflections, setBottomReflections] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  // step3 context
  const [contextObj, setContextObj] = useState({});

  // step1
  const [hazards, setHazards] = useState([]);
  const [femaRecords, setFemaRecords] = useState([]);
  const [locationText, setLocationText] = useState('');
  const [multiHazardData, setMultiHazardData] = useState([]);

  // step2
  const [riskResult, setRiskResult] = useState([]);
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [likelihoodData, setLikelihoodData] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // step3 splitted docs
  const [docsCase, setDocsCase] = useState([]);
  const [docsStrat, setDocsStrat] = useState([]);
  const [docsOther, setDocsOther] = useState([]);

  // docFlags => docKey => { summarySelected, addToReport }
  const [docFlags, setDocFlags] = useState({});
  // docExpands => docKey => bool( expanded or not )
  const [docExpands, setDocExpands] = useState({});
  const [hasLoadedFromServer, setHasLoadedFromServer] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(true);
  const exportRef = useRef(null);
  // ====== load workflow ======
  useEffect(() => {
    if (!workflowState) return;
    const sessionId = getSessionId();

    // 验证数据完整性
    if (
      !workflowState.step2?.selectedRisks?.length ||
      !workflowState.step3?.collection
    ) {
      // 如果关键数据丢失，尝试重新获取完整的工作流数据
      fetch(`${DOMAIN}/workflow?sessionId=${sessionId}`)
        .then((resp) => {
          if (!resp.ok) throw new Error('Failed to fetch workflow data');
          return resp.json();
        })
        .then((data) => {
          if (data) {
            setWorkflowState(data);
          }
        })
        .catch((err) => {
          console.error('Error loading workflow data:', err);
        });
      return;
    }

    // 正常数据加载流程
    const s4 = workflowState.step4 || {};
    const sd = s4.summaryData || {};

    setOverallConclusion(sd.overallConclusion || '');
    setHazardReasons(sd.hazardReasons || {});
    setCollectionSummary(sd.collectionSummary || '');
    setBottomReflections(sd.bottomReflections || '');
    setDocFlags(sd.docFlags || {});

    setHasLoadedFromServer(true);
    setTimeout(() => {
      firstRenderRef.current = false;
    }, 0);
  }, [workflowState]);

  // step1 data loading
  useEffect(() => {
    if (!workflowState?.step1) return;
    const s1 = workflowState.step1;
    const hzs = s1.hazards || [];
    setHazards(hzs);
    setFemaRecords(s1.femaRecords || []);
    setLocationText(s1.location || '');
    setMultiHazardData(buildMultiHazardYearData(hzs, s1.femaRecords || []));
  }, [workflowState?.step1]);

  // step2 data loading
  useEffect(() => {
    if (!workflowState?.step2) return;
    const s2 = workflowState.step2;
    setRiskResult(s2.riskResult || []);
    setSelectedRisks(s2.selectedRisks || []);
    setLikelihoodData(s2.likelihoodData || []);
  }, [workflowState?.step2]);

  // step3 data loading
  useEffect(() => {
    if (!workflowState?.step3) return;
    const step3 = workflowState.step3;

    // context
    setContextObj(step3.context || {});

    // collection docs
    if (step3.collection?.length > 0) {
      const coll = step3.collection;
      const arrC = [];
      const arrS = [];
      const arrO = [];
      coll.forEach((doc) => {
        const dt = doc.metadata?.docType;
        if (dt === 'caseStudy') arrC.push(doc);
        else if (dt === 'strategy') arrS.push(doc);
        else arrO.push(doc);
      });
      setDocsCase(arrC);
      setDocsStrat(arrS);
      setDocsOther(arrO);
    }
  }, [workflowState?.step3]);

  // ====== auto save ======
  const firstRenderRef = useRef(true);
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (!hasLoadedFromServer) return;
    if (!workflowState) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      // 初始化 previousDataRef
      previousDataRef.current = {
        overallConclusion,
        hazardReasons,
        collectionSummary,
        bottomReflections,
        docFlags,
      };
      return;
    }

    // 检查数据是否真的发生了变化
    const currentData = {
      overallConclusion,
      hazardReasons,
      collectionSummary,
      bottomReflections,
      docFlags,
    };

    if (
      JSON.stringify(currentData) === JSON.stringify(previousDataRef.current)
    ) {
      return; // 如果数据没有变化，不需要保存
    }

    // 更新 previousDataRef
    previousDataRef.current = currentData;

    // 执行保存
    saveStep4ToBackend();
    // eslint-disable-next-line
  }, [
    overallConclusion,
    hazardReasons,
    collectionSummary,
    bottomReflections,
    docFlags,
    hasLoadedFromServer,
  ]);
  const debouncedHandleReasonChange = debounce((hz, val) => {
    setHazardReasons((prev) => ({ ...prev, [hz]: val }));
  }, 500); // delay 500ms before updating state
  async function saveStep4ToBackend() {
    try {
      const sessionId = getSessionId();
      // 创建完整的工作流状态的深拷贝
      const newWF = JSON.parse(JSON.stringify(workflowState));

      // 确保存在必要的对象结构
      if (!newWF.step4) newWF.step4 = {};
      if (!newWF.step4.summaryData) newWF.step4.summaryData = {};

      // 更新 step4 数据
      newWF.step4.summaryData.overallConclusion = overallConclusion;
      newWF.step4.summaryData.hazardReasons = hazardReasons;
      newWF.step4.summaryData.collectionSummary = collectionSummary;
      newWF.step4.summaryData.bottomReflections = bottomReflections;
      newWF.step4.summaryData.docFlags = docFlags;

      // 保留其他步骤的数据
      if (!newWF.step3) newWF.step3 = workflowState.step3;
      if (!newWF.step2) newWF.step2 = workflowState.step2;
      if (!newWF.step1) newWF.step1 = workflowState.step1;

      const resp = await fetch(`${DOMAIN}/workflow?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWF),
      });

      if (!resp.ok) {
        throw new Error(`Failed to save workflow: ${resp.status}`);
      }

      // 只有在成功保存后才更新状态
      const savedData = await resp.json();
      setWorkflowState(savedData);
    } catch (err) {
      console.error('Error saving step4 data:', err);
      // 可以添加用户提示
      alert('Failed to save data. Please try again.');
    }
  }

  // hazard reason
  function handleReasonChange(hz, val) {
    setHazardReasons((prev) => ({ ...prev, [hz]: val }));
  }

  // docFlags
  function handleDocFlag(doc, flagName, newVal) {
    const dk = getDocKey(doc);
    setDocFlags((prev) => {
      const old = prev[dk] || {};
      return { ...prev, [dk]: { ...old, [flagName]: newVal } };
    });
  }
  function isFlagChecked(doc, flagName) {
    const dk = getDocKey(doc);
    return !!docFlags[dk]?.[flagName];
  }

  // docExpands
  function toggleDocExpand(doc) {
    const dk = getDocKey(doc);
    setDocExpands((prev) => ({
      ...prev,
      [dk]: !prev[dk],
    }));
  }
  function isDocExpanded(doc) {
    const dk = getDocKey(doc);
    return !!docExpands[dk];
  }

  // ========== Export PDF / Word ==========
  // 1) handleExportPDF => 用 html2pdf.js 把 exportRef.current -> PDF
  async function handleExportPDF() {
    if (!exportRef.current) {
      alert('No ref to export!');
      return;
    }
    try {
      const opt = {
        margin: 0.5,
        filename: 'resilience_step4_report.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: {},
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(exportRef.current).save();
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Failed to export PDF');
    }
  }

  // 2) handleExportDocx => 用 docx 库把核心文字生成 docx
  async function handleExportDocx() {
    try {
      // 大多数情况下，会把“结论 / hazard reasons / collection summary / final thoughts”之类拼成 doc.
      // 也可以做更复杂处理
      const doc = new Document({
        creator: 'ResiliencePlatform',
        title: 'Step4 Final Report',
        description: 'Exported from resilience platform step4',
        sections: [
          {
            properties: {
              // 可加页面尺寸/页边距
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Final Research Report (Step4)',
                    bold: true,
                    size: 28, // half-points, e.g. 28 => 14pt
                  }),
                ],
              }),
              new Paragraph({
                text: '', // 空行
              }),
              new Paragraph({
                text: 'Overall Conclusion:\n' + overallConclusion,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: 'Hazard Reasons:\n' + hazardReasons,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: 'Collection Summary:\n' + collectionSummary,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: 'Final Thoughts:\n' + bottomReflections,
                spacing: { after: 200 },
              }),
              // 你也可以继续添加更多 Paragraphs
            ],
          },
        ],
      });

      // pack to blob
      const blob = await Packer.toBlob(doc);
      // create link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resilience_step4_report.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export Docx error:', err);
      alert('Failed to export Word');
    }
  }

  // Summarize
  async function handleSummarize() {
    try {
      const sessionId = getSessionId();
      setSummarizing(true);
      // only summarySelected
      const step3 = workflowState.step3 || {};
      const coll = step3.collection || [];
      const docsToSumm = coll.filter((doc) => {
        const dk = getDocKey(doc);
        return docFlags[dk]?.summarySelected;
      });
      // +++ (A) "normalize" step: for each doc, if metadata.columnData => build doc.pageContent
      const normalizedDocs = docsToSumm.map((doc) => {
        // 拷贝一份，别直接改原 doc
        const copy = { ...doc };

        // 如果是 CSV chunk => doc.metadata.columnData 存在
        if (copy.metadata?.columnData?.length) {
          const lines = copy.metadata.columnData.map((colObj) => {
            const cName = colObj.colName || 'col?';
            const info = colObj.infoCategory || '';
            const meta = colObj.metaCategory || '';
            const val = colObj.cellValue || '';
            return `[${cName} - ${info}/${meta}]: ${val}`;
          });
          // 拼接多行
          copy.pageContent = lines.join('\n');
        } else {
          // 如果是 PDF chunk => 可能 doc.pageContent 已经有值，或 doc.text?
          // 如果 doc.pageContent 不存在，可以 fallback doc.text
          if (!copy.pageContent && copy.text) {
            copy.pageContent = copy.text;
          }
        }
        return copy;
      });

      if (normalizedDocs.length === 0) {
        alert('No doc selected for summary');
        setSummarizing(false);
        return;
      }
      const resp = await fetch(
        `${DOMAIN}/multiRAG/summarize?sessionId=${sessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: normalizedDocs, language: 'en' }),
        }
      );
      if (!resp.ok) {
        throw new Error('Summarize error ' + resp.status);
      }
      const data = await resp.json();
      setCollectionSummary(data.summary || '(empty summary)');
    } catch (err) {
      console.error('summarize error', err);
      alert(err.message);
    } finally {
      setSummarizing(false);
    }
  }

  // risk table
  function handleSortChange(e) {
    setSortBy(e.target.value);
  }
  function sortedRiskRows() {
    let arr = [...riskResult];
    if (showSelectedOnly) {
      arr = arr.filter((r) =>
        selectedRisks.some(
          (sel) =>
            sel.hazard === r.hazard &&
            sel.systemName === r.systemName &&
            sel.subSystemName === r.subSystemName
        )
      );
    }
    if (!sortBy) return arr;
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'hazard':
          return a.hazard.localeCompare(b.hazard);
        case 'system':
          return a.systemName.localeCompare(b.systemName);
        case 'subSystem':
          return a.subSystemName.localeCompare(b.subSystemName);
        case 'impact':
          return b.impactRating - a.impactRating;
        case 'likelihood':
          return b.likelihoodRating - a.likelihoodRating;
        case 'riskScore':
          return b.riskScore - a.riskScore;
        case 'selected':
          const aSel = selectedRisks.some(
            (sel) =>
              sel.hazard === a.hazard &&
              sel.systemName === a.systemName &&
              sel.subSystemName === a.subSystemName
          );
          const bSel = selectedRisks.some(
            (sel) =>
              sel.hazard === b.hazard &&
              sel.systemName === b.systemName &&
              sel.subSystemName === b.subSystemName
          );
          return (bSel ? 1 : 0) - (aSel ? 1 : 0);
        default:
          return 0;
      }
    });
    return arr;
  }

  // Export
  function handleExport() {
    window.print();
  }

  // ========== renderDocItem ========== //
  function renderDocItem(doc) {
    const dk = getDocKey(doc);
    const expanded = isDocExpanded(doc);
    const highlightLabels = doc.highlightLabels || [];
    const certMatches = doc.certMatches || [];

    // CSV chunk?
    const isCSV = !!doc.metadata?.columnData;

    // 先看 doc.pageContent，再看 doc.text
    let fullText = '';
    if (doc.pageContent) fullText = doc.pageContent;
    else if (doc.text) fullText = doc.text;
    else fullText = '';

    // 源文件信息
    const sourceInfo = `${doc.metadata?.fileName}${
      doc.metadata?.page
        ? ` - Page ${doc.metadata?.page}`
        : doc.metadata?.rowIndex != null
        ? ` - Row ${doc.metadata.rowIndex}`
        : ''
    }`;

    return (
      <Paper sx={{ mb: 1, p: 1 }} key={dk}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            cursor: 'pointer',
          }}
          onClick={() => toggleDocExpand(doc)}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {sourceInfo}
          </Typography>
          <IconButton size="small">
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>

        {/* 始终显示的关键信息 */}
        {/* chunk摘要 */}
        {doc.chunkSummary && (
          <Box sx={{ color: 'blue', mb: 1 }}>
            {doc.chunkSummary
              .split('- ')
              .filter((point) => point.trim())
              .map((point, idx) => (
                <Typography key={idx} variant="subtitle2" sx={{ mb: 0.5 }}>
                  • {point.trim()}
                </Typography>
              ))}
          </Box>
        )}

        {/* 匹配的上下文 */}
        {highlightLabels.length > 0 && (
          <Box sx={{ mt: 1, border: '1px solid #ccc', p: 1, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              <strong>Matched&nbsp;Context:&nbsp;</strong>
              {highlightLabels.map((lbl, i) => {
                const isEm = doc.emphasizedLabels?.some(
                  (em) => em.toLowerCase() === lbl.toLowerCase()
                );
                return (
                  <span
                    key={lbl}
                    style={{
                      color: isEm ? 'red' : 'inherit',
                      fontWeight: isEm ? 600 : 400,
                    }}
                  >
                    {lbl}
                    {i < highlightLabels.length - 1 && ', '}
                  </span>
                );
              })}
            </Typography>
          </Box>
        )}
        {/* 认证匹配 */}
        {certMatches.length > 0 && (
          <Box sx={{ mt: 1, border: '1px solid #ccc', p: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Possible Certification / Best Practices:
            </Typography>
            {certMatches.map((cm, i) => (
              <Box key={i} sx={{ ml: 2, mb: 1 }}>
                {cm.recommendations.map((rec, j) => (
                  <Box key={j} sx={{ mt: 0.5 }}>
                    <Typography variant="subtitle2">{rec.title}</Typography>
                    <Typography variant="body2">{rec.description}</Typography>
                    {rec.sources && rec.sources.length > 0 && (
                      <ul>
                        {rec.sources.map((s, idx) => (
                          <li key={idx}>
                            {s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {s.label || s.url}
                              </a>
                            ) : (
                              <span>{s.label}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}

        {/* 可折叠内容 */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {/* 文档内容 */}
          {isCSV ? (
            // CSV chunk
            <Box sx={{ mt: 1 }}>
              {(doc.metadata.columnData || []).map((col, cidx) => {
                return (
                  <Box key={cidx} sx={{ mb: 1 }}>
                    <strong>
                      {col.colName} | {col.infoCategory} | {col.metaCategory}
                    </strong>
                    <Box
                      sx={{ ml: 2 }}
                      dangerouslySetInnerHTML={{ __html: col.cellValue }}
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            // PDF或其他文本块
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {fullText}
              </Typography>
            </Box>
          )}
        </Collapse>

        {/* 复选框 */}
        <Box sx={{ ml: 2, mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isFlagChecked(doc, 'summarySelected')}
                onChange={(e) =>
                  handleDocFlag(doc, 'summarySelected', e.target.checked)
                }
              />
            }
            label="summarySelected"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isFlagChecked(doc, 'addToReport')}
                onChange={(e) =>
                  handleDocFlag(doc, 'addToReport', e.target.checked)
                }
              />
            }
            label="addToReport"
          />
        </Box>
      </Paper>
    );
  }

  // if not loaded
  if (!workflowState) {
    return (
      <Box
        sx={{
          flex: 1,
          borderRight: '1px solid #ccc',
          height: '100vh',
          overflowY: 'auto',
          p: 2,
          mt: 2,
        }}
      >
        <Toolbar />
        <Typography>Loading Step4...</Typography>
      </Box>
    );
  }

  // main render
  return (
    <Box
      sx={{
        flex: 1,
        borderRight: '1px solid #ccc',
        height: '100vh',
        overflowY: 'auto',
        p: 2,
        mt: 2,
      }}
    >
      <Toolbar />
      <StepProgressBar />
      <Typography variant="h4" gutterBottom>
        Step 4: Final Research Report
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setGuideExpanded(!guideExpanded)}
        >
          <Typography variant="h6">Guidance & Explanation</Typography>
          {guideExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>

        <Collapse in={guideExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              This is where you review everything from previous steps, compile
              your selected resources, hazard reasons, risk matrix, and finalize
              your overall conclusion. You can also generate a PDF or Word doc
              as your final deliverable.
            </Typography>
          </Box>
        </Collapse>
      </Paper>
      <div ref={exportRef}>
        {/* Overall Conclusion */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Overall Conclusion</em>{' '}
          </Typography>
          <TextField
            multiline
            rows={5}
            fullWidth
            placeholder="Your final conclusion..."
            value={overallConclusion}
            onChange={(e) => setOverallConclusion(e.target.value)}
          />
        </Paper>

        {/* Project Context */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Project Context</em>
          </Typography>
          {Object.keys(contextObj).length === 0 ? (
            <Typography sx={{ color: 'text.secondary' }}>
              (No context data)
            </Typography>
          ) : (
            <Box sx={{ ml: 2 }}>
              {Object.entries(contextObj).map(([k, v], i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <strong>{k}:</strong>{' '}
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Hazards & Frequency */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Hazards & Frequency</em>
          </Typography>
          <Typography>
            Location: <strong>{locationText}</strong>
          </Typography>
          {hazards.length === 0 ? (
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              (No hazards)
            </Typography>
          ) : multiHazardData.length === 0 ? (
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              (No date info for hazards)
            </Typography>
          ) : (
            <Box sx={{ width: '100%', height: 300, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={multiHazardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {hazards.map((hz, idx) => (
                    <Bar
                      key={hz}
                      dataKey={hz}
                      fill={colors[idx % colors.length]}
                      barSize={30}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
          {/* step2 likelihood + reason */}
          {hazards.map((hz, i) => {
            const lhObj = likelihoodData.find((ld) => ld.hazard === hz);
            const rating = lhObj ? lhObj.likelihoodRating : '-';
            return (
              <Paper key={i} sx={{ p: 1, mt: 2 }}>
                <Typography variant="subtitle1">
                  {hz}'s Likelihood Rating: {rating}
                </Typography>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="Reason for this rating..."
                  value={hazardReasons[hz] || ''}
                  onChange={(e) =>
                    debouncedHandleReasonChange(hz, e.target.value)
                  }
                />
              </Paper>
            );
          })}
        </Paper>

        {/* Risk Matrix */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Risk Matrix</em>
          </Typography>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={showSelectedOnly}
                  onChange={(e) => setShowSelectedOnly(e.target.checked)}
                />
              }
              label="Show Selected Only"
            />
            <Typography>Sort By:</Typography>
            <Select
              size="small"
              value={sortBy}
              onChange={handleSortChange}
              sx={{ width: 140 }}
            >
              <MenuItem value="">(none)</MenuItem>
              <MenuItem value="hazard">Hazard</MenuItem>
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="subSystem">SubSystem</MenuItem>
              <MenuItem value="impact">Impact</MenuItem>
              <MenuItem value="likelihood">Likelihood</MenuItem>
              <MenuItem value="riskScore">RiskScore</MenuItem>
              <MenuItem value="selected">Selected</MenuItem>
            </Select>
          </Box>
          {riskResult.length === 0 ? (
            <Typography sx={{ color: 'text.secondary' }}>
              (No risk data)
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hazard</TableCell>
                  <TableCell>System</TableCell>
                  <TableCell>SubSystem</TableCell>
                  <TableCell>Impact</TableCell>
                  <TableCell>Likelihood</TableCell>
                  <TableCell>RiskScore</TableCell>
                  <TableCell>Selected?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRiskRows().map((r, idx) => {
                  const sel = selectedRisks.some(
                    (s) =>
                      s.hazard === r.hazard &&
                      s.systemName === r.systemName &&
                      s.subSystemName === r.subSystemName
                  );
                  return (
                    <TableRow key={idx}>
                      <TableCell>{r.hazard}</TableCell>
                      <TableCell>{r.systemName}</TableCell>
                      <TableCell>{r.subSystemName}</TableCell>
                      <TableCell>{r.impactRating}</TableCell>
                      <TableCell>{r.likelihoodRating}</TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: riskCellColor(r.riskScore),
                          fontWeight: 'bold',
                        }}
                      >
                        {r.riskScore}
                      </TableCell>
                      <TableCell>{sel ? 'Yes' : ''}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* Resources & Summaries */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Resources & Summaries</em>
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleSummarize}
              disabled={summarizing}
            >
              Summarize Selected Items
            </Button>
            {summarizing && <CircularProgress size={24} />}
          </Box>
          {collectionSummary && (
            <Paper sx={{ p: 1, mb: 2 }}>
              <Typography variant="subtitle2">Summary Result:</Typography>
              <TextField
                multiline
                rows={10}
                fullWidth
                value={collectionSummary}
                onChange={(e) => setCollectionSummary(e.target.value)}
              />
            </Paper>
          )}
          {/* caseStudy */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Case Study</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {docsCase.length === 0 ? (
                <Typography sx={{ color: 'text.secondary' }}>
                  (No caseStudy)
                </Typography>
              ) : (
                docsCase.map((doc) => renderDocItem(doc))
              )}
            </AccordionDetails>
          </Accordion>
          {/* strategy */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Strategy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {docsStrat.length === 0 ? (
                <Typography sx={{ color: 'text.secondary' }}>
                  (No strategy)
                </Typography>
              ) : (
                docsStrat.map((doc) => renderDocItem(doc))
              )}
            </AccordionDetails>
          </Accordion>
          {/* other resource */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Other Resource</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {docsOther.length === 0 ? (
                <Typography sx={{ color: 'text.secondary' }}>
                  (No other resources)
                </Typography>
              ) : (
                docsOther.map((doc) => renderDocItem(doc))
              )}
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* final thoughts */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">
            <em>Final Thoughts</em>
          </Typography>
          <TextField
            multiline
            rows={2}
            fullWidth
            placeholder="Any last reflections..."
            value={bottomReflections}
            onChange={(e) => setBottomReflections(e.target.value)}
          />
        </Paper>

        {/* Export */}
        {/* <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleExport}>
            Export / Print
          </Button>
          <Button variant="text" component={Link} to="/workflow">
            Back to Workflow Home
          </Button>
        </Box> */}
      </div>

      {/* 导出按钮 */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="contained" onClick={handleExportPDF}>
          Export as PDF
        </Button>
        <Button variant="contained" onClick={handleExportDocx}>
          Export as Word
        </Button>

        <Button variant="text" component={Link} to="/workflow">
          Back to Workflow Home
        </Button>
      </Box>
    </Box>
  );
}
