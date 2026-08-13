import { SERVER_URL } from '../config';

async function request(path, options = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export function getKanaCards() {
  return request('/api/kana-cards');
}

export function generateCards(count = 10) {
  return request(`/api/generate-cards?count=${count}`, { method: 'POST' });
}

export function getRoom(roomCode) {
  return request(`/api/rooms/${encodeURIComponent(roomCode)}`);
}
