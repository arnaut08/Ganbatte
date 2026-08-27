import { getSupabaseClient } from '../config/supabase.js';
import { getUserSocketId, getUsersPresenceStatus } from '../config/redis.js';
import { mergeFriendPresence, normalizeFriendshipPair, type FriendRecord } from '../services/friend-service.js';
import type { Request, Response } from 'express';

interface FriendRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  profiles?: { id: string; display_name: string | null } | null;
}

export async function getFriends(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const supabase = getSupabaseClient();
  const { data: friendshipRows, error: friendshipsError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (friendshipsError) {
    console.error('Failed to load friendships:', friendshipsError);
    res.status(500).json({ error: 'Unable to load friends.' });
    return;
  }

  const friendIds = (friendshipRows || [])
    .map((row) => (row.user_id === user.id ? row.friend_id : row.user_id))
    .filter(Boolean);

  if (friendIds.length === 0) {
    res.json([]);
    return;
  }

  const { data: profileRows, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', friendIds);

  if (profilesError) {
    console.error('Failed to load friend profiles:', profilesError);
    res.status(500).json({ error: 'Unable to load friends.' });
    return;
  }

  const profileMap = new Map((profileRows || []).map((profile) => [profile.id, profile]));
  const friendRows = friendIds
    .map((friendId) => {
      const profile = profileMap.get(friendId) || { id: friendId, display_name: null };
      return {
        id: friendId,
        user_id: friendId,
        ...(profile as object),
        profile,
      };
    })
    .filter((friend) => friend?.id || friend?.user_id);

  const onlineIds = await getUsersPresenceStatus(friendIds.map(String));
  const friends = mergeFriendPresence(friendRows as unknown as FriendRecord[], onlineIds);
  res.json(friends);
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const searchTerm = String(req.query.q || '').trim();

  if (!searchTerm) {
    res.json([]);
    return;
  }

  const supabase = getSupabaseClient();
  const { data: visibleProfiles, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', `%${searchTerm}%`)
    .neq('id', user.id)
    .limit(12);

  if (error) {
    console.error('Failed to search users:', error);
    res.status(500).json({ error: 'Unable to search users.' });
    return;
  }

  const onlineIds = await getUsersPresenceStatus((visibleProfiles || []).map((person) => String(person.id)));
  const results = mergeFriendPresence((visibleProfiles || []).map((person) => ({
    ...person,
    id: person.id,
    user_id: person.id,
    profile: person,
  })) as unknown as FriendRecord[], onlineIds);
  res.json(results);
}

export async function getFriendRequests(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const supabase = getSupabaseClient();
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at, profiles!friend_requests_sender_id_fkey(id, display_name)')
    .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load friend requests:', error);
    res.status(500).json({ error: 'Unable to search users.' });
    return;
  }

  const typedRequests = (requests || []) as unknown as FriendRequestRow[];
  const onlineIds = await getUsersPresenceStatus(typedRequests.map((request) => request.sender_id));
  const results = typedRequests.map((request) => ({
    id: request.id,
    sender_id: request.sender_id,
    receiver_id: request.receiver_id,
    status: request.status,
    created_at: request.created_at,
    direction: request.sender_id === user.id ? 'outgoing' : 'incoming',
    sender: {
      id: request.profiles?.id,
      user_id: request.profiles?.id,
      display_name: request.profiles?.display_name,
      online: onlineIds.includes(String(request.sender_id)),
    },
  }));

  res.json(results);
}

export async function createFriendRequest(req: Request<{ userId: string }>, res: Response): Promise<void> {
  const user = req.user!;
  const targetUserId = String(req.params.userId || '').trim();

  if (!targetUserId || targetUserId === user.id) {
    res.status(400).json({ error: 'Friend must be a different user.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError || !profileData) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const { data: existingFriendship, error: friendshipError } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('friend_id', targetUserId)
    .maybeSingle();

  if (friendshipError) {
    console.error('Failed to check friendship:', friendshipError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  if (existingFriendship) {
    res.status(409).json({ error: 'You are already friends with this user.' });
    return;
  }

  const { data: existingRequest, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to check friend request:', requestError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      res.status(409).json({ error: 'A friend request already exists.' });
      return;
    }

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', String(existingRequest.id));

    if (updateError) {
      console.error('Failed to update friend request:', updateError);
      res.status(500).json({ error: 'Unable to send friend request.' });
      return;
    }

    const receiverSocketId = await getUserSocketId(targetUserId);
    if (receiverSocketId) {
      req.app.get('io').to(receiverSocketId).emit('friend-request-received', {
        requestId: existingRequest.id,
        sender: {
          id: user.id,
          user_id: user.id,
          display_name: profileData.display_name,
        },
      });
    }

    res.json({ success: true, requestId: existingRequest.id });
    return;
  }

  const { data: newRequest, error: insertError } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending' })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to create friend request:', insertError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  const receiverSocketId = await getUserSocketId(targetUserId);
  if (receiverSocketId) {
    req.app.get('io').to(receiverSocketId).emit('friend-request-received', {
      requestId: newRequest.id,
      sender: {
        id: user.id,
        user_id: user.id,
        display_name: profileData.display_name,
      },
    });
  }

  res.json({ success: true, requestId: newRequest.id });
}

export async function acceptFriendRequest(req: Request<{ requestId: string }>, res: Response): Promise<void> {
  const user = req.user!;
  const requestId = String(req.params.requestId || '').trim();

  if (!requestId) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to load friend request:', requestError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  if (!request) {
    res.status(404).json({ error: 'Friend request not found.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(409).json({ error: 'This friend request is no longer pending.' });
    return;
  }

  const [leftUserId, rightUserId] = normalizeFriendshipPair(String(request.sender_id), String(request.receiver_id));

  const { error: friendshipError } = await supabase
    .from('friendships')
    .upsert({ user_id: leftUserId, friend_id: rightUserId }, {
      onConflict: 'user_id,friend_id',
      ignoreDuplicates: true,
    });

  if (friendshipError) {
    console.error('Failed to create friendship:', friendshipError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to update friend request:', updateError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', String(request.sender_id))
    .maybeSingle();

  const onlineIds = await getUsersPresenceStatus([String(request.sender_id)]);
  const senderSocketId = await getUserSocketId(String(request.sender_id));

  if (senderSocketId) {
    req.app.get('io').to(senderSocketId).emit('friend-request-accepted', {
      requestId,
      friend: {
        id: user.id,
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      },
    });
  }

  res.json({
    success: true,
    friend: {
      ...(senderProfile || {}),
      user_id: request.sender_id,
      id: request.sender_id,
      online: onlineIds.includes(String(request.sender_id)),
    },
  });
}

export async function rejectFriendRequest(req: Request<{ requestId: string }>, res: Response): Promise<void> {
  const user = req.user!;
  const requestId = String(req.params.requestId || '').trim();

  if (!requestId) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to load friend request:', requestError);
    res.status(500).json({ error: 'Unable to reject friend request.' });
    return;
  }

  if (!request) {
    res.status(404).json({ error: 'Friend request not found.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(409).json({ error: 'This friend request is no longer pending.' });
    return;
  }

  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to reject friend request:', updateError);
    res.status(500).json({ error: 'Unable to reject friend request.' });
    return;
  }

  if (request?.sender_id) {
    const senderSocketId = await getUserSocketId(String(request.sender_id));
    if (senderSocketId) {
      req.app.get('io').to(senderSocketId).emit('friend-request-rejected', {
        requestId,
        senderId: request.sender_id,
        receiver: {
          id: user.id,
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        },
      });
    }
  }

  res.json({ success: true });
}

export async function removeFriend(req: Request<{ userId: string }>, res: Response): Promise<void> {
  const user = req.user!;
  const targetUserId = String(req.params.userId || '').trim();

  const supabase = getSupabaseClient();
  const [leftUserId, rightUserId] = normalizeFriendshipPair(user.id, targetUserId);
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${leftUserId},friend_id.eq.${rightUserId}),and(user_id.eq.${rightUserId},friend_id.eq.${leftUserId})`);

  if (error) {
    console.error('Failed to remove friendship:', error);
    res.status(500).json({ error: 'Unable to remove friend.' });
    return;
  }

  res.json({ success: true });
}
