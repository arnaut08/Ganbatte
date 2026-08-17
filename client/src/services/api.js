import { SERVER_URL } from '../config';
import { supabase } from '../config/supabase';

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export function getKanaCards() {
  return request('/api/kana-cards');
}

export function getKanjiCards() {
  return request('/api/kanji-cards');
}

export function generateCards(count = 10) {
  return request(`/api/generate-cards?count=${count}`, { method: 'POST' });
}

export function getRoom(roomCode) {
  return request(`/api/rooms/${encodeURIComponent(roomCode)}`);
}

export function getFriends() {
  return request('/api/friends');
}

export function searchUsers(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return Promise.resolve([]);
  return request(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
}

export function getFriendRequests() {
  return request('/api/friend-requests');
}

export function sendFriendRequest(userId) {
  return request(`/api/friend-requests/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export function acceptFriendRequest(requestId) {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' });
}

export function rejectFriendRequest(requestId) {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/reject`, { method: 'POST' });
}

export function addFriend(userId) {
  return request(`/api/friends/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export function removeFriend(userId) {
  return request(`/api/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}