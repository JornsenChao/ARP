// backendJS/routes/precedentsRouter.js
// const express = require('express');
// const {
//   getAllPrecedents,
//   getPrecedentById,
// } = require('../controllers/precedentsController');
import { Router } from 'express';
import {
  getAllPrecedents,
  getPrecedentById,
} from '../controllers/precedentsController.js';
// const router = express.Router();
const router = Router();

// GET /precedents
router.get('/', getAllPrecedents);
// GET /precedents/:id
router.get('/:id', getPrecedentById);

// module.exports = router;
export default router;
