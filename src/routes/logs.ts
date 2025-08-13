import { Router } from 'express';
import { receiveLog } from '../controllers/logController';

const router = Router();

// Accept single or batch logs from clients
router.post('/', receiveLog);

export default router;


