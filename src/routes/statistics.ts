import { Router } from 'express';
import {
  getEventAttendance,
  getEventsAttendance,
  getAllEntriesByBucket,
  getEventEntries
} from '../controllers/statisticsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// כל המסלולים דורשים התחברות
router.use(authenticateToken);

// סטטיסטיקות נוכחות
router.get('/event/:eventId', requireAdmin, getEventAttendance); // נוכחות לאירוע מסוים
router.get('/events', requireAdmin, getEventsAttendance);

router.get("/event/:eventId", requireAdmin, getEventEntries);

// כל האירועים - קיבוץ ל־5 דקות
router.get("/buckets", requireAdmin, getAllEntriesByBucket);


export default router;