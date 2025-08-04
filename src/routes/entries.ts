import { Router } from 'express';
import {
  createEntry,
  createEntryByBarcode,
  getAllEntries,
  getEntryById,
  deleteEntry,
  getEntriesByEvent,
  getEntryStats,
  getGeneralEntryStats,
  checkParticipantEntry
} from '../controllers/entryController';
import { authenticateToken, requireScanner, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Scanner routes (accessible by scanner and admin)
router.post('/', requireScanner, createEntry);
router.post('/barcode', requireScanner, createEntryByBarcode);
router.get('/event/:eventId', requireScanner, getEntriesByEvent);
router.get('/stats/:eventId', requireScanner, getEntryStats);
router.get('/stats', requireScanner, getGeneralEntryStats);
router.get('/check/:participantId/:eventId', requireScanner, checkParticipantEntry);

// Admin only routes
router.get('/', requireAdmin, getAllEntries);
router.get('/:id', requireAdmin, getEntryById);
router.delete('/:id', requireAdmin, deleteEntry);

export default router; 