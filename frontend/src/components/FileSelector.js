// src/components/FileSelector.js
import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Stack,
  Select,
  MenuItem,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';

const DOMAIN = 'http://localhost:8000';

const FileSelector = ({ fileList = [], fetchFileList, activeFile, setActiveFile }) => {
  const [demoName, setDemoName] = useState('');
  const [snack, setSnack] = useState({ open: false, text: '', severity: 'success' });
  const openSnack = (text, severity = 'success') =>
    setSnack({ open: true, text, severity });
  const closeSnack = () => setSnack({ open: false, text: '', severity: 'success' });

  const loadDemo = async () => {
    if (!demoName.trim()) return;
    try {
      const res = await axios.get(`${DOMAIN}/useDemo?fileKey=${demoName.trim()}`);
      if (res.status === 200) {
        openSnack(`Demo "${demoName}" loaded!`);
        fetchFileList();
        setActiveFile(demoName.trim());
      }
    } catch (err) {
      console.error(err);
      openSnack('Load demo failed', 'error');
    }
  };

  return (
    <Box mb={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Select
          size="small"
          sx={{ width: 200 }}
          displayEmpty
          value={activeFile || ''}
          onChange={(e) => setActiveFile(e.target.value)}
        >
          <MenuItem value="" disabled>
            Select file
          </MenuItem>
          {fileList.map((fileKey) => (
            <MenuItem key={fileKey} value={fileKey}>
              {fileKey}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2">
          Current:&nbsp;{activeFile || 'None'}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} mt={1}>
        <TextField
          size="small"
          sx={{ width: 120 }}
          placeholder="pdf / csv ..."
          value={demoName}
          onChange={(e) => setDemoName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadDemo()}
        />
        <Button variant="contained" onClick={loadDemo}>
          Load Demo
        </Button>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={closeSnack} sx={{ width: '100%' }}>
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileSelector;
