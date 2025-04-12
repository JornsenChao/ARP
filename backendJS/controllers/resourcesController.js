// backendJS/controllers/resourcesController.js
// const resourcesData = require('../data/resourcesData');
import { resourcesData } from '../data/resourcesData.js';
// GET /resources
export const getAllResources = (req, res) => {
  const { query } = req.query;

  if (query) {
    const q = query.toLowerCase();
    const filtered = resourcesData.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
    return res.json(filtered);
  }

  res.json(resourcesData);
};

// GET /resources/:id
export const getResourceById = (req, res) => {
  const resourceId = parseInt(req.params.id, 10);
  const resource = resourcesData.find((r) => r.id === resourceId);

  if (!resource) {
    return res.status(404).json({ detail: 'Resource not found' });
  }
  res.json(resource);
};

// module.exports = {
//   getAllResources,
//   getResourceById,
// };
