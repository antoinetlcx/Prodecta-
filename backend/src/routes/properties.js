import express from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertyByAccessLink,
} from '../controllers/propertyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes protégées (hôtes)
router.post('/', authenticateToken, createProperty);
router.get('/', authenticateToken, getProperties);
router.get('/:id', authenticateToken, getPropertyById);
router.put('/:id', authenticateToken, updateProperty);
router.delete('/:id', authenticateToken, deleteProperty);

// Route publique (voyageurs)
router.get('/public/:propertyId', getPropertyByAccessLink);

export default router;
