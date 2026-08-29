import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { filterVocab, getVocabOverview, getVocabStage, reviewVocab } from '../controllers/vocab-controller.js';

const router = Router();

router.use(requireAuth);
router.get('/vocab/overview', getVocabOverview);
router.get('/vocab/stage/:stageNumber', getVocabStage);
router.get('/vocab/filter', filterVocab);
router.post('/vocab/review', reviewVocab);

export default router;