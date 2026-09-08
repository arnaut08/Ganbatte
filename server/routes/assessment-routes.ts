import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateAssessment, getActiveMatchSession, getCharacterAttempts, getKanjiAttempts, getPvpRecord, recordCharacterAttempt, recordKanjiAttempt, reviewKanji, updateCharacterConfidenceBatch, updateKanjiConfidenceBatch } from '../controllers/assessment-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/assessments/generate', generateAssessment);
router.get('/assessments/active-session', getActiveMatchSession);
router.post('/kanji-attempts', recordKanjiAttempt);
router.get('/kanji-attempts', getKanjiAttempts);
router.post('/kanji/review', reviewKanji);
router.patch('/kanji-attempts/confidence', updateKanjiConfidenceBatch);
router.post('/character-attempts', recordCharacterAttempt);
router.get('/character-attempts', getCharacterAttempts);
router.patch('/character-attempts/confidence', updateCharacterConfidenceBatch);
router.get('/pvp-record', getPvpRecord);

export default router;
