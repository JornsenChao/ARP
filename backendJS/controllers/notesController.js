// backendJS/controllers/notesController.js

import { notesData } from '../mockData/notesData.js';
// GET /notes?stepId=xxx&taskId=xxx
// 获取全部笔记，或按 stepId/taskId 做简单过滤
export const getAllNotes = (req, res) => {
  const { stepId, taskId } = req.query;

  // 如果传了 stepId/taskId，就做相应过滤
  let filtered = notesData;
  if (stepId) {
    filtered = filtered.filter((n) => n.stepId == stepId);
  }
  if (taskId) {
    filtered = filtered.filter((n) => n.taskId == taskId);
  }

  res.json(filtered);
};

// GET /notes/:id
export const getNoteById = (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  const note = notesData.find((n) => n.id === noteId);
  if (!note) {
    return res.status(404).json({ detail: 'Note not found' });
  }
  res.json(note);
};

// POST /notes
// Body: { content, stepId, taskId }
export const createNote = (req, res) => {
  const { content, stepId, taskId } = req.body;

  if (!content) {
    return res.status(400).json({ detail: 'content is required' });
  }

  // 生成新ID
  const newId = notesData.length
    ? Math.max(...notesData.map((n) => n.id)) + 1
    : 1;

  const newNote = {
    id: newId,
    content,
    stepId: stepId ? parseInt(stepId, 10) : null,
    taskId: taskId ? parseInt(taskId, 10) : null,
    createTime: new Date().toISOString(),
  };

  notesData.push(newNote);
  res.status(201).json(newNote);
};

// PUT /notes/:id
// 用于更新笔记
export const updateNote = (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  const noteIndex = notesData.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) {
    return res.status(404).json({ detail: 'Note not found' });
  }

  const { content } = req.body;
  // 仅做简易更新
  if (content) {
    notesData[noteIndex].content = content;
  }

  res.json(notesData[noteIndex]);
};

// DELETE /notes/:id
export const deleteNote = (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  const noteIndex = notesData.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) {
    return res.status(404).json({ detail: 'Note not found' });
  }
  const deleted = notesData.splice(noteIndex, 1);
  res.json(deleted[0]);
};
