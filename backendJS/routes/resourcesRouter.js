// backendJS/routes/resourcesRouter.js
const express = require('express');
const {
  getAllResources,
  getResourceById,
} = require('../controllers/resourcesController');

const router = express.Router();

// GET /resources
router.get('/', getAllResources);
// GET /resources/:id
router.get('/:id', getResourceById);

module.exports = router;
