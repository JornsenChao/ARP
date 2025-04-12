// backendJS/routes/resourcesRouter.js
// const express = require('express');
// const {
//   getAllResources,
//   getResourceById,
// } = require('../controllers/resourcesController');
import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
} from '../controllers/resourcesController.js';
// const router = express.Router();
const router = Router();
// const router = express.Router();

// GET /resources
router.get('/', getAllResources);
// GET /resources/:id
router.get('/:id', getResourceById);

// module.exports = router;
export default router;
