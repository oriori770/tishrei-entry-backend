import { Router } from 'express';
import {
  getEventAttendance,
  getEventsAttendance,
} from '../controllers/statisticsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// כל המסלולים דורשים התחברות
router.use(authenticateToken);

// סטטיסטיקות נוכחות
router.get('/event/:eventId', requireAdmin, getEventAttendance); // נוכחות לאירוע מסוים
router.get('/events', requireAdmin, getEventsAttendance);

export default router;