import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  generateCards,
  getKanaCards,
  getKanjiCards,
  getRoomByCode,
} from '../controllers/game-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/kana-cards', getKanaCards);
router.get('/kanji-cards', getKanjiCards);
router.get('/rooms/:code', getRoomByCode);
router.post('/generate-cards', generateCards);

export default router;
