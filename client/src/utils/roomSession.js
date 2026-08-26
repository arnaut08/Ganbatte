const SESSION_KEY_STORAGE = 'ganbatte-session-key';
const ROOM_SESSION_STORAGE = 'ganbatte-room-session';

export function getSessionKey() {
  const existingKey = localStorage.getItem(SESSION_KEY_STORAGE);
  if (existingKey) return existingKey;
  const sessionKey = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
  return sessionKey;
}

export function saveRoomSession(roomCode, username) {
  localStorage.setItem(ROOM_SESSION_STORAGE, JSON.stringify({ roomCode, username }));
}

export function readRoomSession() {
  const raw = localStorage.getItem(ROOM_SESSION_STORAGE);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRoomQueryParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export function clearRoomSession() {
  localStorage.removeItem(ROOM_SESSION_STORAGE);
  clearRoomQueryParam();
}
