import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { deleteAccount } from '../controllers/account-controller.js';

const router = Router();

router.delete('/account', requireAuth, deleteAccount);

export default router;