import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../controllers/activity-controller.js';

const router = Router();

router.use(requireAuth);

router.post('/activity', recordActivity);

export default router;
