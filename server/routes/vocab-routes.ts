import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { filterVocab, getVocabOverview, getVocabStage, markVocabAgain, reviewVocab, saveStageQuizResult } from '../controllers/vocab-controller.js';

const router = Router();

router.use(requireAuth);
router.get('/vocab/overview', getVocabOverview);
router.get('/vocab/stage/:stageNumber', getVocabStage);
router.get('/vocab/filter', filterVocab);
router.post('/vocab/review', reviewVocab);
router.post('/vocab/mark-again', markVocabAgain);
router.post('/vocab/quiz-results', saveStageQuizResult);

export default router;