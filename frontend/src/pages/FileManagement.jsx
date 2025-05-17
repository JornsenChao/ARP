// src/pages/FileManagement.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Stack,
  Button,
  IconButton,
  Typography,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Card,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Toolbar,
  Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ColumnMapper from '../components/ColumnMapper';
import RenderQA from '../components/RenderQA';
import ChatComponent from '../components/ChatComponent';
import { getSessionId } from '../utils/sessionId';
import { API_BASE as DOMAIN } from '../utils/apiBase';
const LOCALSTORAGE_PREFIX = 'doc_conversation_';

const DOC_TYPE_OPTIONS = [
  { label: 'Case Study', value: 'caseStudy' },
  { label: 'Strategy', value: 'strategy' },
  { label: 'Other Resource', value: 'otherResource' },
];

function FileManagement() {
  /* ---------------- state ---------------- */
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  /** Upload dialog */
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadDocType, setUploadDocType] = useState('otherResource');
  const uploadInputRef = useRef(null);

  /** Edit dialog */
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editDocType, setEditDocType] = useState('otherResource');

  /** Map dialog */
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapRecord, setMapRecord] = useState(null);
  const [columnSchema, setColumnSchema] = useState([]);
  const [availableCols, setAvailableCols] = useState([]);

  /** Chat */
  const [activeChatFile, setActiveChatFile] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  /** Snackbar */
  const [snack, setSnack] = useState({
    open: false,
    text: '',
    severity: 'info',
  });
  const openSnack = (text, severity = 'info') =>
    setSnack({ open: true, text, severity });
  const closeSnack = () => setSnack({ ...snack, open: false });

  /* ---------------- fetch files on mount ---------------- */
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await axios.get(
        `${DOMAIN}/files/list?sessionId=${sessionId}`
      );
      setFileList(res.data);
    } catch (err) {
      console.error(err);
      openSnack('Failed to fetch file list', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- upload ---------------- */
  const handleUploadFile = async (file) => {
    try {
      const sessionId = getSessionId();
      const formData = new FormData();
      uploadTags.forEach((tag) => formData.append('tags', tag));
      // 这里我们也传 docType
      formData.append('docType', uploadDocType);
      formData.append('file', file);

      const res = await axios.post(
        `${DOMAIN}/files/upload?sessionId=${sessionId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      if (res.data.fileKey) {
        openSnack('File uploaded', 'success');
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
      openSnack('Upload failed', 'error');
    }
  };

  /* ---------------- delete ---------------- */
  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure to delete file: ${record.fileName}?`))
      return;
    try {
      const sessionId = getSessionId();
      await axios.delete(
        `${DOMAIN}/files/${record.fileKey}?sessionId=${sessionId}`
      );
      openSnack('File deleted', 'success');
      fetchFiles();
      if (activeChatFile === record.fileKey) setActiveChatFile('');
    } catch (err) {
      console.error(err);
      openSnack('Delete failed', 'error');
    }
  };

  /* ---------------- delete session ---------------- */ const handleDeleteSession =
    async () => {
      if (
        !window.confirm(
          'WARNING: Deleting this session will:\n\n' +
            '1. Delete all uploaded files\n' +
            '2. Remove all workflows and progress\n' +
            '3. Clear all conversation history\n' +
            '4. Erase all locally stored data\n\n' +
            'This action cannot be undone. Are you sure you want to continue?'
        )
      ) {
        return;
      }
      try {
        const sessionId = getSessionId();
        await axios.delete(`${DOMAIN}/session?sessionId=${sessionId}`);

        // Clear localStorage
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith(LOCALSTORAGE_PREFIX) || key === 'APP_SESSION_ID') {
            localStorage.removeItem(key);
          }
        }

        // Generate new session ID by clearing the cached one
        localStorage.removeItem('APP_SESSION_ID');
        window.location.reload(); // Reload to reset all states with new session
      } catch (err) {
        console.error(err);
        openSnack('Failed to delete session', 'error');
      }
    };

  /* ---------------- edit ---------------- */
  const openEditModal = (record) => {
    setEditRecord(record);
    setEditName(record.fileName);
    setEditTags(record.tags || []);
    setEditDocType(record.docType || 'otherResource');
    setEditModalVisible(true);
  };

  const handleEditOk = async () => {
    try {
      const sessionId = getSessionId();
      await axios.patch(
        `${DOMAIN}/files/${editRecord.fileKey}?sessionId=${sessionId}`,
        {
          newName: editName,
          tags: editTags,
          docType: editDocType,
        }
      );
      openSnack('File updated', 'success');
      setEditModalVisible(false);
      fetchFiles();
    } catch (err) {
      console.error(err);
      openSnack('Update failed', 'error');
    }
  };

  /* ---------------- map / build ---------------- */
  const openMapModal = async (record) => {
    setMapRecord(record);
    try {
      const sessionId = getSessionId();
      const res = await axios.get(
        `${DOMAIN}/files/${record.fileKey}/columns?sessionId=${sessionId}`
      );
      setAvailableCols(res.data || []);
    } catch (err) {
      console.error(err);
      openSnack('Failed to get columns', 'error');
      setAvailableCols([]);
    }
    setColumnSchema(record.columnSchema || []);
    setMapModalVisible(true);
  };

  const handleMapOk = async () => {
    if (!mapRecord) return;
    try {
      const sessionId = getSessionId();
      await axios.post(
        `${DOMAIN}/files/${mapRecord.fileKey}/mapColumns?sessionId=${sessionId}`,
        {
          columnSchema,
        }
      );
      openSnack('Column map saved', 'success');
      await axios.post(
        `${DOMAIN}/files/${mapRecord.fileKey}/buildStore?sessionId=${sessionId}`
      );
      openSnack('Vector store built', 'success');
      setMapModalVisible(false);
      fetchFiles();
    } catch (err) {
      console.error(err);
      openSnack('Map/Build failed', 'error');
    }
  };

  /* ---------------- load demo ---------------- */
  const loadDemo = async (demoName) => {
    try {
      const sessionId = getSessionId();
      const res = await axios.get(
        `${DOMAIN}/files/loadDemo?sessionId=${sessionId}`,
        {
          params: { demoName },
        }
      );
      if (res.data.fileKey) {
        openSnack(res.data.message || 'Demo file loaded', 'success');
        await fetchFiles();
        setActiveChatFile(res.data.fileKey);
      }
    } catch (err) {
      console.error(err);
      openSnack('Load demo failed', 'error');
    }
  };
  async function loadAllDemos() {
    try {
      const sessionId = getSessionId();
      const res = await axios.get(
        `${DOMAIN}/files/loadAllDemos?sessionId=${sessionId}`
      );
      if (res.status === 200) {
        openSnack('Loaded all demo files successfully!', 'success');
        // 这里 res.data 是 loaded: [ {fileKey, message, buildMsg}, ... ]
        console.log('loadAllDemos response:', res.data);
        // 你可以发起 fetchFileList() 更新前端表格
        await fetchFiles();
      }
    } catch (err) {
      console.error('LoadAllDemos error:', err);
      openSnack('LoadAllDemos error: ' + err.message, 'error');
    }
  }
  /* ---------------- chat memory ---------------- */
  useEffect(() => {
    if (!activeChatFile) {
      setConversation([]);
      return;
    }
    const localKey = LOCALSTORAGE_PREFIX + activeChatFile;
    const savedVal = localStorage.getItem(localKey);
    setConversation(savedVal ? JSON.parse(savedVal) : []);
  }, [activeChatFile]);

  useEffect(() => {
    if (!activeChatFile) return;
    localStorage.setItem(
      LOCALSTORAGE_PREFIX + activeChatFile,
      JSON.stringify(conversation)
    );
  }, [activeChatFile, conversation]);

  const handleResp = (question, answer) =>
    setConversation((prev) => [...prev, { question, answer }]);

  /* ---------------- table helpers ---------------- */
  const renderTags = (tags = []) =>
    tags.map((t) => (
      <Typography
        key={t}
        variant="caption"
        sx={{ mr: 0.75, bgcolor: '#eee', px: 0.5, borderRadius: 0.5 }}
      >
        {t}
      </Typography>
    ));

  /* ---------------- UI ---------------- */
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
      <Typography variant="h4" gutterBottom>
        File Management
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
          <Typography variant="h5">Guidance & Explanation</Typography>
          {guideExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>

        <Collapse in={guideExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1 }}>
            <Typography paragraph>
              In <strong>File Management</strong>, you can upload new files,
              assign their document type (<em>Case Study</em>, <em>Strategy</em>
              , or
              <em>Other Resource</em>), and build a searchable vector store for
              use in subsequent steps.
            </Typography>

            <Typography paragraph>
              <strong>Basic steps:</strong>
              <ol>
                <li>
                  Click <em>Upload New File</em> and select either PDF/TXT or
                  spreadsheet format (CSV/XLSX).
                </li>
                <li>
                  Choose <em>docType</em> (<strong>caseStudy</strong>,
                  <strong>strategy</strong>, or <strong>otherResource</strong>),
                  depending on your intended usage.
                </li>
                <li>
                  For spreadsheet files, next use <em>Map &amp; Build</em> to
                  assign a semantic meaning to each column (e.g.,{' '}
                  <em>infoCategory</em> and
                  <em>metaCategory</em>). This ensures data is unified across
                  multiple sources when you search later.
                </li>
                <li>
                  After mapping columns, click <em>Save &amp; Build</em> to
                  finalize the store. For PDFs or TXT, you can directly click{' '}
                  <em>BuildStore</em>.
                </li>
              </ol>
            </Typography>

            <Typography paragraph>
              Remember that{' '}
              <strong>research quality depends on data quality</strong>.
              Providing well-structured files and clear semantic column mappings
              helps ensure consistent and accurate results when analyzing or
              cross-referencing multiple documents.
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* top actions */}
      <Stack direction="row" spacing={1} mb={2}>
        <Button variant="contained" onClick={() => setUploadModalVisible(true)}>
          Upload New File
        </Button>
        <Divider orientation="vertical" flexItem />
        {/* <Typography variant="body2" sx={{ mt: 0.75 }}>
          Load Demo:
        </Typography> */}
        <Button variant="contained" onClick={loadAllDemos}>
          Load All Demo Files
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={handleDeleteSession}
          startIcon={<DeleteIcon />}
        >
          Delete Session
        </Button>
        {/* <Button size="small" onClick={() => loadDemo('demo.pdf')}>
          Demo PDF
        </Button>
        <Button size="small" onClick={() => loadDemo('demo.csv')}>
          Demo CSV
        </Button> */}
      </Stack>

      {/* file table */}
      <Paper variant="outlined">
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'File Name',
                  'Tags',
                  'docType',
                  'FileType',
                  'StoreBuilt',
                  'Created At',
                  'Actions',
                ].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {fileList.map((row) => (
                <TableRow key={row.fileKey}>
                  <TableCell>{row.fileName}</TableCell>
                  <TableCell>{renderTags(row.tags)}</TableCell>
                  <TableCell>{row.docType || ''}</TableCell>
                  <TableCell>{row.fileType}</TableCell>
                  <TableCell>{row.storeBuilt ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : ''}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" onClick={() => openEditModal(row)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </Button>

                      {['.csv', '.xlsx', '.xls'].includes(row.fileType) && (
                        <Button size="small" onClick={() => openMapModal(row)}>
                          Map&nbsp;&amp;&nbsp;Build
                        </Button>
                      )}

                      {['.pdf', '.txt'].includes(row.fileType) &&
                        !row.storeBuilt && (
                          <Button
                            size="small"
                            onClick={async () => {
                              try {
                                const sessionId = getSessionId();
                                await axios.post(
                                  `${DOMAIN}/files/${row.fileKey}/buildStore?sessionId=${sessionId}`
                                );
                                openSnack('Store built', 'success');
                                fetchFiles();
                              } catch (err) {
                                console.error(err);
                                openSnack('Build store failed', 'error');
                              }
                            }}
                          >
                            Build Store
                          </Button>
                        )}

                      {row.storeBuilt && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setActiveChatFile(row.fileKey);
                            openSnack(
                              `Now chatting about file: ${row.fileName}`,
                              'info'
                            );
                          }}
                        >
                          Chat
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* ---------------- Upload Dialog ---------------- */}
      <Dialog
        open={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Tags (comma separated)"
              onChange={(e) =>
                setUploadTags(
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">Document Type:</Typography>
              <Select
                size="small"
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                sx={{ width: 200 }}
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <input
                type="file"
                hidden
                ref={uploadInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                }}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => uploadInputRef.current?.click()}
              >
                Select file
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadModalVisible(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Edit Dialog ---------------- */}
      <Dialog
        open={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit File</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="New Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <TextField
              label="Tags (comma separated)"
              value={editTags.join(', ')}
              onChange={(e) =>
                setEditTags(
                  e.target.value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean)
                )
              }
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">Document Type:</Typography>
              <Select
                size="small"
                value={editDocType}
                onChange={(e) => setEditDocType(e.target.value)}
                sx={{ width: 200 }}
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditOk}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Map Dialog ---------------- */}
      <Dialog
        open={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Map Columns &amp; Build Store</DialogTitle>
        <DialogContent dividers>
          <ColumnMapper
            columns={availableCols}
            columnSchema={columnSchema}
            setColumnSchema={setColumnSchema}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapModalVisible(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMapOk}>
            Save &amp; Build
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Chat Panel ---------------- */}
      {activeChatFile && (
        <Card sx={{ mt: 3, background: '#f9f9f9', p: 2 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">
              Chat about file: {activeChatFile}
            </Typography>
            <IconButton color="error" onClick={() => setActiveChatFile('')}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              mb: 2,
              pr: 1,
            }}
          >
            <RenderQA conversation={conversation} isLoading={isChatLoading} />
          </Box>{' '}
          <ChatComponent
            handleResp={handleResp}
            isLoading={isChatLoading}
            setIsLoading={setIsChatLoading}
            activeFile={activeChatFile}
            docId={`doc-${activeChatFile}`}
          />
        </Card>
      )}

      {/* ---------------- Snackbar ---------------- */}
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
}

export default FileManagement;
