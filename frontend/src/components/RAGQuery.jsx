// src/components/RAGQuery.js
import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GraphViewer from './GraphViewer';

const DOMAIN = 'http://localhost:8000';

const RAGQuery = ({ fileKey, dependencyData, customFields = [] }) => {
  // query + language
  const [userQuery, setUserQuery] = useState('');
  const [language, setLanguage] = useState('en');

  // loading flags
  const [loadingNormal, setLoadingNormal] = useState(false);
  const [loadingCoT, setLoadingCoT] = useState(false);

  // answers / prompts / docs
  const [answerNormal, setAnswerNormal] = useState('');
  const [promptNormal, setPromptNormal] = useState('');
  const [docs, setDocs] = useState([]);

  const [answerCoT, setAnswerCoT] = useState('');
  const [promptCoT, setPromptCoT] = useState('');

  // graph
  const [graphData, setGraphData] = useState(null);
  const [selectedLibrary, setSelectedLibrary] = useState('ReactForceGraph3d');
  const [selectedFramework, setSelectedFramework] = useState('');

  // prompt modal
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [promptModalContent, setPromptModalContent] = useState('');

  // snackbar (replaces antd message)
  const [snack, setSnack] = useState({
    open: false,
    text: '',
    severity: 'info',
  });
  const openSnack = (text, severity = 'info') =>
    setSnack({ open: true, text, severity });
  const closeSnack = () =>
    setSnack({ open: false, text: '', severity: 'info' });

  // ---------- handlers ----------
  const handleQueryNormal = async () => {
    if (!fileKey) return openSnack('No file selected', 'error');
    if (!userQuery.trim()) return openSnack('Type something', 'warning');

    setLoadingNormal(true);
    setAnswerNormal('');
    setPromptNormal('');

    try {
      const res = await axios.post(`${DOMAIN}/proRAG/query`, {
        fileKey,
        dependencyData,
        userQuery,
        language,
        customFields,
      });
      setAnswerNormal(res.data.answer);
      setPromptNormal(res.data.usedPrompt);
      setDocs(res.data.docs || []);
    } catch (err) {
      console.error(err);
      openSnack('Query normal error', 'error');
    } finally {
      setLoadingNormal(false);
    }
  };

  const handleQueryCoT = async () => {
    if (!fileKey) return openSnack('No file selected', 'error');
    if (!userQuery.trim()) return openSnack('Type something', 'warning');

    setLoadingCoT(true);
    setAnswerCoT('');
    setPromptCoT('');

    try {
      const res = await axios.post(`${DOMAIN}/proRAG/queryCoT`, {
        fileKey,
        dependencyData,
        userQuery,
        language,
        customFields,
      });
      setAnswerCoT(res.data.answer);
      setPromptCoT(res.data.usedPrompt);
    } catch (err) {
      console.error(err);
      openSnack('Query CoT error', 'error');
    } finally {
      setLoadingCoT(false);
    }
  };

  const handleViewInGraph = async () => {
    if (!docs || docs.length === 0)
      return openSnack('No docs to visualize', 'warning');

    try {
      const res = await axios.post(`${DOMAIN}/proRAG/buildGraph`, {
        docs,
        frameworkName: selectedFramework,
      });
      setGraphData(res.data.graphData);
      openSnack('Graph built', 'success');
    } catch (err) {
      console.error(err);
      openSnack('Graph build error', 'error');
    }
  };

  const showPromptModal = (which) => {
    setPromptModalContent(which === 'normal' ? promptNormal : promptCoT);
    setPromptModalVisible(true);
  };

  // ---------- helper ----------
  const LoadingBtn = ({ loading, children, onClick, color = 'primary' }) => (
    <Button
      variant="contained"
      color={color}
      onClick={onClick}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={18} /> : null}
    >
      {children}
    </Button>
  );

  // ---------- UI ----------
  return (
    <Box>
      {/* query textarea */}
      <TextField
        multiline
        rows={3}
        fullWidth
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        placeholder="Type your question..."
        sx={{ mb: 2 }}
      />

      {/* language selector */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2">Answer language:</Typography>
        <Select
          size="small"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          sx={{ width: 120 }}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="zh">中文</MenuItem>
          <MenuItem value="es">Español</MenuItem>
        </Select>
      </Stack>

      {/* action buttons */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <LoadingBtn loading={loadingNormal} onClick={handleQueryNormal}>
          RAG Query
        </LoadingBtn>
        <LoadingBtn
          loading={loadingCoT}
          onClick={handleQueryCoT}
          color="secondary"
        >
          RAG Query + CoT
        </LoadingBtn>
      </Stack>

      {/* answers */}
      {answerNormal && (
        <Box mt={3}>
          <Typography variant="h6">Normal RAG Answer</Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {answerNormal}
          </ReactMarkdown>
          <Button sx={{ mt: 1 }} onClick={() => showPromptModal('normal')}>
            Show Final Prompt
          </Button>
        </Box>
      )}

      {answerCoT && (
        <Box mt={3}>
          <Typography variant="h6">CoT RAG Answer</Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerCoT}</ReactMarkdown>
          <Button sx={{ mt: 1 }} onClick={() => showPromptModal('cot')}>
            Show CoT Prompt
          </Button>
        </Box>
      )}

      {/* graph builder */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">
        Build &amp; View Graph from retrieved docs
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Select
          size="small"
          value={selectedFramework}
          onChange={(e) => setSelectedFramework(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="">(none)</MenuItem>
          <MenuItem value="AIA">AIA Framework</MenuItem>
        </Select>
        <Select
          size="small"
          value={selectedLibrary}
          onChange={(e) => setSelectedLibrary(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="cytoscape">Cytoscape</MenuItem>
          <MenuItem value="d3Force">D3 Force</MenuItem>
          <MenuItem value="ReactForceGraph3d">3D ForceGraph</MenuItem>
        </Select>
        <Button variant="outlined" onClick={handleViewInGraph}>
          View in Graph
        </Button>
      </Stack>

      {graphData && (
        <Box mt={3}>
          <GraphViewer library={selectedLibrary} graphData={graphData} />
        </Box>
      )}

      {/* prompt dialog */}
      <Dialog
        open={promptModalVisible}
        onClose={() => setPromptModalVisible(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Final Prompt</DialogTitle>
        <DialogContent dividers>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {promptModalContent}
          </pre>
        </DialogContent>
      </Dialog>

      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={closeSnack}
          sx={{ width: '100%' }}
        >
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RAGQuery;
