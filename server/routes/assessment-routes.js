import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateAssessment, getKanjiAttempts, recordKanjiAttempt, updateKanjiConfidenceBatch } from '../controllers/assessment-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/assessments/generate', generateAssessment);
router.post('/kanji-attempts', recordKanjiAttempt);
router.get('/kanji-attempts', getKanjiAttempts);
router.patch('/kanji-attempts/confidence', updateKanjiConfidenceBatch);

export default router;
