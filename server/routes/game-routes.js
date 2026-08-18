import { Router } from 'express';
import {
  generateCards,
  getKanaCards,
  getKanjiCards,
  getRoomByCode,
  healthCheck,
} from '../controllers/game-controller.js';

const router = Router();

router.get('/kana-cards', getKanaCards);
router.get('/kanji-cards', getKanjiCards);
router.get('/rooms/:code', getRoomByCode);
router.post('/generate-cards', generateCards);
router.get('/health', healthCheck);

export default router;
