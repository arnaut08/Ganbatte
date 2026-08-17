import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { REDIS_URL } from './env.js';

let redisClient;
let redisSubscriber;
const USER_CONNECTION_TTL_SECONDS = 120;

export function isRedisConfigured() {
  return Boolean(REDIS_URL);
}

export async function configureRedisAdapter(io) {
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

export async function claimUserConnection(userId, socketId) {
  if (!redisClient?.isReady || !userId) return null;

  return redisClient.eval(
    `local previous = redis.call('GET', KEYS[1])
     redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
     return previous`,
    {
      keys: [`ganbatte:user-connection:${userId}`],
      arguments: [socketId, String(USER_CONNECTION_TTL_SECONDS)],
    },
  );
}

export async function refreshUserConnection(userId, socketId) {
  if (!redisClient?.isReady || !userId) return;

  await redisClient.eval(
    `if redis.call('GET', KEYS[1]) == ARGV[1] then
       return redis.call('EXPIRE', KEYS[1], ARGV[2])
     end
     return 0`,
    {
      keys: [`ganbatte:user-connection:${userId}`],
      arguments: [socketId, String(USER_CONNECTION_TTL_SECONDS)],
    },
  );
}

export async function releaseUserConnection(userId, socketId) {
  if (!redisClient?.isReady || !userId) return;

  await redisClient.eval(
    `if redis.call('GET', KEYS[1]) == ARGV[1] then
       return redis.call('DEL', KEYS[1])
     end
     return 0`,
    {
      keys: [`ganbatte:user-connection:${userId}`],
      arguments: [socketId],
    },
  );
}

export async function getUsersPresenceStatus(userIds = []) {
  if (!redisClient?.isReady || !Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((userId) => String(userId)))];
  if (uniqueUserIds.length === 0) {
    return [];
  }

  const keys = uniqueUserIds.map((userId) => `ganbatte:user-connection:${userId}`);
  const values = await redisClient.mGet(keys);

  return uniqueUserIds.filter((userId, index) => Boolean(values[index]));
}

export async function getUserPresenceStatus(userId) {
  if (!userId) return false;
  const [online] = await getUsersPresenceStatus([userId]);
  return Boolean(online);
}

export async function closeRedis() {
  if (redisClient?.isOpen) await redisClient.quit();
  if (redisSubscriber?.isOpen) await redisSubscriber.quit();
}
