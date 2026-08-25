import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../services/api';
import type { Friend, FriendRequest } from '../services/api';
import type { AppStatus } from '../contexts/AppContext';
import type { ToastType } from './useToast';

type FriendsOptions = {
  user: User | null;
  status: AppStatus;
  showToast: (message: string, type?: ToastType) => void;
};

type SocialDataCache = {
  userId: string | null;
  friendsLoaded: boolean;
  requestsLoaded: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function useFriends({ user, status, showToast }: FriendsOptions) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSearchResults, setFriendSearchResults] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isFriendSearchLoading, setIsFriendSearchLoading] = useState(false);
  const socialDataCacheRef = useRef<SocialDataCache>({ userId: null, friendsLoaded: false, requestsLoaded: false });

  const clearSocialDataCache = useCallback(() => {
    socialDataCacheRef.current = { userId: null, friendsLoaded: false, requestsLoaded: false };
  }, []);

  const refreshFriends = useCallback(async (force = false) => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      return;
    }
    const cache = socialDataCacheRef.current;
    if (!force && cache.userId === user.id && cache.friendsLoaded) return;
    try {
      const data = await getFriends();
      setFriends(Array.isArray(data) ? data : []);
      socialDataCacheRef.current = { ...socialDataCacheRef.current, userId: user.id, friendsLoaded: true };
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  }, [user]);

  const refreshFriendRequests = useCallback(async (force = false) => {
    if (!user) {
      setFriendRequests([]);
      return;
    }
    const cache = socialDataCacheRef.current;
    if (!force && cache.userId === user.id && cache.requestsLoaded) return;
    try {
      const data = await getFriendRequests();
      setFriendRequests(Array.isArray(data) ? data : []);
      socialDataCacheRef.current = { ...socialDataCacheRef.current, userId: user.id, requestsLoaded: true };
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  }, [user]);

  const refreshFriendData = useCallback(async (force = false) => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      setFriendRequests([]);
      clearSocialDataCache();
      return;
    }
    const cache = socialDataCacheRef.current;
    if (!force && cache.userId === user.id && cache.friendsLoaded && cache.requestsLoaded) return;
    try {
      const [friendsData, requestsData] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setFriendRequests(Array.isArray(requestsData) ? requestsData : []);
      socialDataCacheRef.current = { userId: user.id, friendsLoaded: true, requestsLoaded: true };
    } catch (error) {
      console.error('Failed to refresh friends and requests:', error);
    }
  }, [clearSocialDataCache, user]);

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      setFriendRequests([]);
      clearSocialDataCache();
      return;
    }
    refreshFriendData(true);
  }, [clearSocialDataCache, refreshFriendData, user]);

  useEffect(() => {
    if (user && status === 'friends') refreshFriendData(true);
  }, [refreshFriendData, status, user]);

  const handleSearchUsers = useCallback(async (query: string) => {
    if (!user) {
      setFriendSearchResults([]);
      return;
    }
    const trimmed = String(query || '').trim();
    setIsFriendSearchLoading(Boolean(trimmed));
    try {
      const results = trimmed ? await searchUsers(trimmed) : [];
      setFriendSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setFriendSearchResults([]);
    } finally {
      setIsFriendSearchLoading(false);
    }
  }, [user]);

  const handleSendFriendRequest = useCallback(async (userId: string) => {
    if (!userId || !user) return;
    try {
      const response = await sendFriendRequest(userId);
      const nextRequestId = typeof response.requestId === 'string'
        ? response.requestId
        : typeof response.id === 'string' ? response.id : undefined;
      if (nextRequestId) {
        setFriendRequests((current) => current.some((request) => request.id === nextRequestId)
          ? current
          : [{ id: nextRequestId, sender_id: user.id, receiver_id: userId, status: 'pending', direction: 'outgoing', sender: { id: user.id, user_id: user.id, display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You' } }, ...current]);
      }
      showToast('Friend request sent.', 'success');
      refreshFriendRequests(true);
    } catch (error: unknown) {
      console.error('Failed to send friend request:', error);
      showToast(getErrorMessage(error, 'Unable to send friend request.'), 'error');
    }
  }, [refreshFriendRequests, showToast, user]);

  const handleAcceptFriendRequest = useCallback(async (requestId: string) => {
    if (!requestId) return;
    try {
      const response = await acceptFriendRequest(requestId);
      const friend = response.friend as Friend | undefined;
      if (friend) setFriends((current) => current.some((currentFriend) => (currentFriend.user_id || currentFriend.id) === (friend.user_id || friend.id)) ? current : [...current, friend]);
      showToast('Friend request accepted.', 'success');
      setFriendRequests((current) => current.filter((request) => request.id !== requestId));
      refreshFriendData(true);
    } catch (error: unknown) {
      console.error('Failed to accept friend request:', error);
      showToast(getErrorMessage(error, 'Unable to accept friend request.'), 'error');
    }
  }, [refreshFriendData, showToast]);

  const handleRejectFriendRequest = useCallback(async (requestId: string) => {
    if (!requestId) return;
    try {
      await rejectFriendRequest(requestId);
      showToast('Friend request rejected.', 'warning');
      setFriendRequests((current) => current.filter((request) => request.id !== requestId));
      refreshFriendRequests(true);
    } catch (error: unknown) {
      console.error('Failed to reject friend request:', error);
      showToast(getErrorMessage(error, 'Unable to reject friend request.'), 'error');
    }
  }, [refreshFriendRequests, showToast]);

  const handleRemoveFriend = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      await removeFriend(userId);
      setFriends((current) => current.filter((friend) => (friend.user_id || friend.id) !== userId));
      showToast('Friend removed.', 'warning');
      refreshFriends(true);
    } catch (error: unknown) {
      console.error('Failed to remove friend:', error);
      showToast(getErrorMessage(error, 'Unable to remove friend.'), 'error');
    }
  }, [refreshFriends, showToast]);

  return { friends, friendSearchResults, friendRequests, isFriendSearchLoading, refreshFriends, refreshFriendRequests, refreshFriendData, clearSocialDataCache, handleSearchUsers, handleSendFriendRequest, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend };
}
