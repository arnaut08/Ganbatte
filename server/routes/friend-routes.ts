import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  acceptFriendRequest,
  createFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from '../controllers/friend-controller.js';

const router = Router();

router.use(requireAuth);

router.get('/friends', getFriends);
router.get('/users/search', searchUsers);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-requests/:userId', createFriendRequest);
router.post('/friend-requests/:requestId/accept', acceptFriendRequest);
router.post('/friend-requests/:requestId/reject', rejectFriendRequest);
router.delete('/friends/:userId', removeFriend);

export default router;
