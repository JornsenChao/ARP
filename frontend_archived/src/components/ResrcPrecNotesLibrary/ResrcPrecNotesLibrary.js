// src/components/ResrcPrecNotesLibrary/ResrcPrecNotesLibrary.js
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  TextField,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  Paper,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE as DOMAIN } from '../../utils/apiBase';

function ResrcPrecNotesLibrary({
  isOpen,
  onClose,
  currentStepId = null,
  currentTaskId = null,
}) {
  // -----------------------
  // State: 筛选/查询相关
  // -----------------------
  const [query, setQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState('');

  // -----------------------
  // 三大库数据
  // -----------------------
  const [resources, setResources] = useState([]);
  const [precedents, setPrecedents] = useState([]);
  const [notes, setNotes] = useState([]);

  // -----------------------
  // Notes输入框
  // -----------------------
  const [noteContent, setNoteContent] = useState('');

  // -----------------------
  // useEffect
  // -----------------------
  useEffect(() => {
    if (!isOpen) return; // 面板关闭时不抓取
    fetchResources();
    fetchPrecedents();
    fetchNotes();
    // eslint-disable-next-line
  }, [isOpen, query, hazardFilter, currentStepId, currentTaskId]);

  // -----------------------
  // Fetch 资源/先例/笔记
  // -----------------------
  const fetchResources = async () => {
    try {
      let url = `${DOMAIN}/resources?query=${encodeURIComponent(query)}`;
      // 如果要加 hazardFilter: url += `&hazard=${hazardFilter}`
      const response = await fetch(url);
      const data = await response.json();
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const fetchPrecedents = async () => {
    try {
      let url = `${DOMAIN}/precedents?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      setPrecedents(data);
    } catch (err) {
      console.error('Error fetching precedents:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      let url = `${DOMAIN}/notes`;
      const params = [];
      if (currentStepId) params.push(`stepId=${currentStepId}`);
      if (currentTaskId) params.push(`taskId=${currentTaskId}`);
      if (params.length) url += `?${params.join('&')}`;
      const response = await fetch(url);
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // -----------------------
  // Create Note
  // -----------------------
  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const response = await fetch(`${DOMAIN}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          stepId: currentStepId,
          taskId: currentTaskId,
        }),
      });
      const newNote = await response.json();
      setNotes((prev) => [...prev, newNote]);
      setNoteContent('');
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  // -----------------------
  // Attach Resource/Precedent (示例)
  // -----------------------
  const handleAttachResource = (resource) => {
    console.log('Attach resource to step/task:', resource);
  };
  const handleAttachPrecedent = (precedent) => {
    console.log('Attach precedent:', precedent);
  };

  // 如果抽屉关闭则不渲染
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: 1000 }, // 右侧抽屉的宽度
      }}
    >
      {/* 外层竖排容器 */}
      <Box
        sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* 顶部关闭栏 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="h6">Resources / Precedents / Notes</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 筛选器 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            label="Search..."
            variant="outlined"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: 200 }}
          />
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel id="hazard-select-label">Hazard</InputLabel>
            <Select
              labelId="hazard-select-label"
              value={hazardFilter}
              label="Hazard"
              onChange={(e) => setHazardFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="flood">Flood</MenuItem>
              <MenuItem value="earthquake">Earthquake</MenuItem>
              <MenuItem value="hurricane">Hurricane</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* 三列容器：Resources / Precedents / Notes */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flex: 1, // 占用剩余高度
            mt: 1,
          }}
        >
          {/* -------------------- Left Column: Resources -------------------- */}
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderColor: '#ccc',
              p: 1,
              overflow: 'hidden',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Resources
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List>
                {resources.map((res) => (
                  <ListItem
                    key={res.id}
                    disableGutters
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {/* 左侧文字 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{res.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {res.description}
                      </Typography>
                    </Box>
                    {/* 右侧按钮 */}
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAttachResource(res)}
                      >
                        ATTACH
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>

          {/* -------------------- Middle Column: Precedents -------------------- */}
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderColor: '#ccc',
              p: 1,
              overflow: 'hidden',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Precedents
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List>
                {precedents.map((pre) => (
                  <ListItem
                    key={pre.id}
                    disableGutters
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {/* 左侧文字 */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{pre.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pre.description}
                      </Typography>
                    </Box>
                    {/* 右侧按钮 */}
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAttachPrecedent(pre)}
                      >
                        ATTACH
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>

          {/* -------------------- Right Column: Notes -------------------- */}
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderColor: '#ccc',
              p: 1,
              overflow: 'hidden',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Notes (Step: {currentStepId ?? 'None'}, Task:{' '}
              {currentTaskId ?? 'None'})
            </Typography>

            {/* 笔记列表 */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List>
                {notes.map((note) => (
                  <ListItem
                    key={note.id}
                    disableGutters
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">{note.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      [Step {note.stepId}, Task {note.taskId ?? 'N/A'}] -{' '}
                      {new Date(note.createTime).toLocaleString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* 笔记输入框 */}
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Add a note..."
                multiline
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                fullWidth
              />
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Button variant="contained" onClick={handleCreateNote}>
                  SAVE NOTE
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Drawer>
  );
}

export default ResrcPrecNotesLibrary;
