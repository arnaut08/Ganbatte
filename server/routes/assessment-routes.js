import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateAssessment } from '../controllers/assessment-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/assessments/generate', generateAssessment);

export default router;
