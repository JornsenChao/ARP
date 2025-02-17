// backendJS/routes/precedentsRouter.js
const express = require('express');
const {
  getAllPrecedents,
  getPrecedentById,
} = require('../controllers/precedentsController');

const router = express.Router();

// GET /precedents
router.get('/', getAllPrecedents);
// GET /precedents/:id
router.get('/:id', getPrecedentById);

module.exports = router;
