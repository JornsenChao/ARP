// backendJS/controllers/precedentsController.js

import { precedentsData } from '../mockData/precedentsData.js';
// GET /precedents
export const getAllPrecedents = (req, res) => {
  const { query } = req.query;

  if (query) {
    const q = query.toLowerCase();
    const filtered = precedentsData.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
    return res.json(filtered);
  }

  res.json(precedentsData);
};

// GET /precedents/:id
export const getPrecedentById = (req, res) => {
  const precedentId = parseInt(req.params.id, 10);
  const precedent = precedentsData.find((p) => p.id === precedentId);

  if (!precedent) {
    return res.status(404).json({ detail: 'Precedent not found' });
  }
  res.json(precedent);
};
