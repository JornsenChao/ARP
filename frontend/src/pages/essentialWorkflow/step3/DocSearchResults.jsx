// frontend/src/pages/essentialWorkflow/step3/DocSearchResults.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  Paper,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  IconButton,
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
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

import { linkify } from '../../../utils/linkify';
import DOMPurify from 'dompurify';
import DependencySelector from '../../../components/DependencySelector';
import StepProgressBar from '../StepProgressBar';
import GraphViewer from '../../../components/GraphViewer';
import axios from 'axios';

import { API_BASE as DOMAIN } from '../../../utils/apiBase';
// Helper to generate unique key for doc chunk
export function getDocKey(doc) {
  // e.g. use fileName + page or rowIndex
  const fn = doc.metadata?.fileName || 'unknownFile';
  const rowIdx = doc.metadata?.rowIndex ?? '';
  const page = doc.metadata?.page ?? '';
  // plus any chunk or line info if needed
  return `${fn}||${rowIdx}||${page}`;
}

// Check if doc is in current collection
export function isDocInCollection(doc, collection) {
  const dk = getDocKey(doc);
  return collection.some((c) => getDocKey(c) === dk);
}

function DocSearchResults({
  docs,
  collection,
  onAddToCollection,
  onRemoveFromCollection,
}) {
  const [expandedCards, setExpandedCards] = useState({});

  // 设置所有卡片的初始展开状态
  useEffect(() => {
    if (docs?.length) {
      const initialState = docs.reduce((acc, _, idx) => {
        acc[idx] = true; // 设置每个卡片为展开状态
        return acc;
      }, {});
      setExpandedCards(initialState);
    }
  }, [docs]);

  const handleExpandClick = (idx) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (!docs || docs.length === 0) {
    return <Typography>No results yet.</Typography>;
  }

  return (
    <div>
      {docs.map((doc, idx) => {
        const inCollection = isDocInCollection(doc, collection);
        const isExpanded = expandedCards[idx] || false;

        return (
          <div key={idx}>
            <Card sx={{ mb: 1 }}>
              <Box
                sx={{
                  //   p: 1,
                  ml: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid #eee' : 'none',
                }}
                onClick={() => handleExpandClick(idx)}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'medium', color: '#999' }}
                >
                  Possiblely Matched Hazard and Certification
                </Typography>
                <IconButton aria-label="expand" size="small">
                  {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
              </Box>

              <Collapse in={isExpanded}>
                <Box sx={{ p: 1 }}>
                  {/* 如果存在同义词匹配 */}
                  {doc.highlightLabels && doc.highlightLabels.length > 0 && (
                    <Box sx={{ mt: 1, border: '1px solid #ccc', p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        <strong>Matched&nbsp;Context:&nbsp;</strong>
                        {doc.highlightLabels.map((lbl, i) => {
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
                              {i < doc.highlightLabels.length - 1 && ', '}
                            </span>
                          );
                        })}
                      </Typography>
                    </Box>
                  )}

                  {/* 如果存在 certMatches */}
                  {doc.certMatches && doc.certMatches.length > 0 && (
                    <Box sx={{ mt: 1, border: '1px solid #ccc', p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Possible Certification / Best Practices:
                      </Typography>
                      {doc.certMatches.map((cm, i) => (
                        <Box key={i} sx={{ ml: 2, mb: 1 }}>
                          {cm.recommendations.map((rec, j) => (
                            <Box key={j} sx={{ mt: 0.5 }}>
                              <Typography variant="subtitle2">
                                {rec.title}
                              </Typography>
                              <Typography variant="body2">
                                {rec.description}
                              </Typography>
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
                </Box>
              </Collapse>
            </Card>
            {/* Add / Remove Collection 按钮 */}
            <Box sx={{ mt: 1 }}>
              {isDocInCollection(doc, collection) ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromCollection(doc);
                  }}
                >
                  Remove from Collection
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCollection(doc);
                  }}
                >
                  Add to Collection
                </Button>
              )}
            </Box>
          </div>
        );
      })}
    </div>
  );
}
export default DocSearchResults;
