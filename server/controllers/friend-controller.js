import { getSupabaseClient } from '../config/supabase.js';
import { getUserSocketId, getUsersPresenceStatus } from '../config/redis.js';
import { mergeFriendPresence } from '../services/friend-service.js';

export async function getFriends(req, res) {
  const user = req.user;

  const supabase = getSupabaseClient();
  const { data: friendshipRows, error: friendshipsError } = await supabase
    .from('friendships')
    .select('friend_id, profiles!friendships_friend_id_fkey(id, display_name)')
    .eq('user_id', user.id);

  if (friendshipsError) {
    console.error('Failed to load friendships:', friendshipsError);
    res.status(500).json({ error: 'Unable to load friends.' });
    return;
  }

  const friendRows = (friendshipRows || [])
    .map((row) => ({
      id: row.friend_id,
      user_id: row.friend_id,
      ...row.profiles,
      profile: row.profiles,
    }))
    .filter((friend) => friend?.id || friend?.user_id);

  const friendIds = friendRows.map((friend) => friend.id).filter(Boolean);
  if (friendIds.length === 0) {
    res.json([]);
    return;
  }

  const onlineIds = await getUsersPresenceStatus(friendIds);
  const friends = mergeFriendPresence(friendRows, onlineIds);
  res.json(friends);
}

export async function searchUsers(req, res) {
  const user = req.user;
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

  const onlineIds = await getUsersPresenceStatus((visibleProfiles || []).map((person) => person.id));
  const results = mergeFriendPresence((visibleProfiles || []).map((person) => ({
    ...person,
    id: person.id,
    user_id: person.id,
    profile: person,
  })), onlineIds);
  res.json(results);
}

export async function getFriendRequests(req, res) {
  const user = req.user;

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

  const onlineIds = await getUsersPresenceStatus((requests || []).map((request) => request.sender_id));
  const results = (requests || []).map((request) => ({
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
      online: onlineIds.includes(request.sender_id),
    },
  }));

  res.json(results);
}

export async function createFriendRequest(req, res) {
  const user = req.user;
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
      .eq('id', existingRequest.id);

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

export async function acceptFriendRequest(req, res) {
  const user = req.user;
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

  const rows = [
    { user_id: request.sender_id, friend_id: request.receiver_id },
    { user_id: request.receiver_id, friend_id: request.sender_id },
  ];

  const { error: friendshipError } = await supabase
    .from('friendships')
    .upsert(rows, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });

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
    .eq('id', request.sender_id)
    .maybeSingle();

  const onlineIds = await getUsersPresenceStatus([request.sender_id]);
  const senderSocketId = await getUserSocketId(request.sender_id);

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
      online: onlineIds.includes(request.sender_id),
    },
  });
}

export async function rejectFriendRequest(req, res) {
  const user = req.user;
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
    const senderSocketId = await getUserSocketId(request.sender_id);
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

export async function removeFriend(req, res) {
  const user = req.user;
  const targetUserId = String(req.params.userId || '').trim();

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);

  if (error) {
    console.error('Failed to remove friendship:', error);
    res.status(500).json({ error: 'Unable to remove friend.' });
    return;
  }

  res.json({ success: true });
}
