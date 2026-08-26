import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { RedisClientType } from 'redis';
import type { Server } from 'socket.io';
import { REDIS_URL } from './env.js';

/** @type {ReturnType<typeof createClient> | undefined} */
let redisClient: ReturnType<typeof createClient> | undefined;
/** @type {ReturnType<typeof createClient> | undefined} */
let redisSubscriber: ReturnType<typeof createClient> | undefined;
const USER_CONNECTION_TTL_SECONDS = 15 * 60;

// In-memory fallback for presence tracking when Redis is not configured.
// Maps userId -> { socketId, expiresAt }.
/** @typedef {{ socketId: string, expiresAt: number }} MemoryConnection */
/** @type {Map<string, MemoryConnection>} */
const memoryConnections = new Map();
/** @param {string} userId */
const getUserConnectionKey = (userId: string): string => `ganbatte:user-connection:${userId}`;

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL);
}

function cleanupExpiredMemoryConnections(): void {
  const now = Date.now();
  for (const [userId, connection] of memoryConnections) {
    if (connection.expiresAt <= now) {
      memoryConnections.delete(userId);
    }
  }
}

/** @param {{ adapter: (value: unknown) => void }} io */
export async function configureRedisAdapter(io: Server): Promise<ReturnType<typeof createClient> | null> {
  if (!isRedisConfigured()) {
    console.warn('REDIS_URL is not configured; using the in-memory Socket.io adapter.');
    return null;
  }

  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();
  pubClient.on('error', (error) => console.error('Redis publisher error:', error));
  subClient.on('error', (error) => console.error('Redis subscriber error:', error));
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  redisClient = pubClient;
  redisSubscriber = subClient;
  console.log('Redis Socket.io adapter configured successfully.');
  return redisClient;
}

/** @param {string | null | undefined} userId @param {string} socketId */
export async function claimUserConnection(userId: string | null | undefined, socketId: string): Promise<string | null> {
  if (!userId) return null;

  if (!redisClient?.isReady) {
    // In-memory fallback
    const previous = memoryConnections.get(String(userId))?.socketId || null;
    memoryConnections.set(String(userId), {
      socketId,
      expiresAt: Date.now() + USER_CONNECTION_TTL_SECONDS * 1000,
    });
    return previous;
  }

  const previous = await redisClient.eval(
    `local previous = redis.call('GET', KEYS[1])
     redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
     return previous`,
    {
      keys: [getUserConnectionKey(userId)],
      arguments: [socketId, String(USER_CONNECTION_TTL_SECONDS)],
    },
  );
  return typeof previous === 'string' ? previous : null;
}

/** @param {string | null | undefined} userId @param {string} socketId */
export async function refreshUserConnection(userId: string | null | undefined, socketId: string): Promise<void> {
  if (!userId) return;

  if (!redisClient?.isReady) {
    // In-memory fallback
    const connection = memoryConnections.get(String(userId));
    if (connection?.socketId === socketId) {
      connection.expiresAt = Date.now() + USER_CONNECTION_TTL_SECONDS * 1000;
    }
    return;
  }

  await redisClient.eval(
    `if redis.call('GET', KEYS[1]) == ARGV[1] then
       return redis.call('EXPIRE', KEYS[1], ARGV[2])
     end
     return 0`,
    {
      keys: [getUserConnectionKey(userId)],
      arguments: [socketId, String(USER_CONNECTION_TTL_SECONDS)],
    },
  );
}

/** @param {string | null | undefined} userId @param {string} socketId */
export async function releaseUserConnection(userId: string | null | undefined, socketId: string): Promise<void> {
  if (!userId) return;

  if (!redisClient?.isReady) {
    // In-memory fallback
    const connection = memoryConnections.get(String(userId));
    if (connection?.socketId === socketId) {
      memoryConnections.delete(String(userId));
    }
    return;
  }

  await redisClient.eval(
    `if redis.call('GET', KEYS[1]) == ARGV[1] then
       return redis.call('DEL', KEYS[1])
     end
     return 0`,
    {
      keys: [getUserConnectionKey(userId)],
      arguments: [socketId],
    },
  );
}

/** @param {string | null | undefined} userId */
export async function getUserSocketId(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;

  if (!redisClient?.isReady) {
    // In-memory fallback
    cleanupExpiredMemoryConnections();
    return memoryConnections.get(String(userId))?.socketId || null;
  }

  return redisClient.get(getUserConnectionKey(userId));
}

/** @param {Array<string | null | undefined>} userIds */
export async function getUsersPresenceStatus(userIds: Array<string | null | undefined> = []): Promise<string[]> {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((userId) => String(userId)))];
  if (uniqueUserIds.length === 0) {
    return [];
  }

  if (!redisClient?.isReady) {
    // In-memory fallback
    cleanupExpiredMemoryConnections();
    return uniqueUserIds.filter((userId) => memoryConnections.has(userId));
  }

  const keys = uniqueUserIds.map(getUserConnectionKey);
  const values = await redisClient.mGet(keys);

  return uniqueUserIds.filter((userId, index) => Boolean(values[index]));
}

/** @param {string | null | undefined} userId */
export async function getUserPresenceStatus(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const [online] = await getUsersPresenceStatus([userId]);
  return Boolean(online);
}

/** @param {string} key @returns {Promise<unknown>} */
export async function getCachedJson(key: string): Promise<unknown> {
  if (!redisClient?.isReady) return null;
  const value = await redisClient.get(key);
  return value ? JSON.parse(value) : null;
}

/** @param {string} key @param {unknown} value @param {number} ttlSeconds */
export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redisClient?.isReady) return;
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function closeRedis(): Promise<void> {
  if (redisClient?.isOpen) await redisClient.quit();
  if (redisSubscriber?.isOpen) await redisSubscriber.quit();
}
