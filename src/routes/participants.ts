import { Router } from 'express';
import {
  getAllParticipantsWithPaginationAndSearch,
  getParticipantById,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantByBarcode
} from '../controllers/participantController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by both admin and scanner
router.get('/', getAllParticipantsWithPaginationAndSearch);
router.get('/barcode/:barcode', getParticipantByBarcode);
router.get('/:id', getParticipantById);

// Admin only routes
router.post('/', requireAdmin, createParticipant);
router.put('/:id', requireAdmin, updateParticipant);
router.delete('/:id', requireAdmin, deleteParticipant);

export default router; 