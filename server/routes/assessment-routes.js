import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateAssessment, getCharacterAttempts, getKanjiAttempts, recordCharacterAttempt, recordKanjiAttempt, updateCharacterConfidenceBatch, updateKanjiConfidenceBatch } from '../controllers/assessment-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/assessments/generate', generateAssessment);
router.post('/kanji-attempts', recordKanjiAttempt);
router.get('/kanji-attempts', getKanjiAttempts);
router.patch('/kanji-attempts/confidence', updateKanjiConfidenceBatch);
router.post('/character-attempts', recordCharacterAttempt);
router.get('/character-attempts', getCharacterAttempts);
router.patch('/character-attempts/confidence', updateCharacterConfidenceBatch);

export default router;
