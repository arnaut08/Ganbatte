import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getGrammarLesson,
  listGrammarLessons,
} from '../controllers/grammar-lesson-controller.js';

const router = Router();

router.use(requireAuth);
router.get('/grammar-lessons', listGrammarLessons);
router.get('/grammar-lessons/:lessonNumber', getGrammarLesson);

export default router;