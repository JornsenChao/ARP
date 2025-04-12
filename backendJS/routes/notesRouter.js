// backendJS/routes/notesRouter.js

// const express = require('express');
// const {
//   getAllNotes,
//   getNoteById,
//   createNote,
//   updateNote,
//   deleteNote,
// } = require('../controllers/notesController');
import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/notesController.js';
// const router = express.Router();
const router = Router();

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

// module.exports = router;
export default router;
