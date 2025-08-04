import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getActiveEvents,
  toggleEventStatus
} from '../controllers/eventController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by both admin and scanner
router.get('/', getAllEvents);
router.get('/active', getActiveEvents);
router.get('/:id', getEventById);

// Admin only routes
router.post('/', requireAdmin, createEvent);
router.put('/:id', requireAdmin, updateEvent);
router.delete('/:id', requireAdmin, deleteEvent);
router.patch('/:id/toggle-status', requireAdmin, toggleEventStatus);

export default router; 