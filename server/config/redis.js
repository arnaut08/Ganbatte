import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { REDIS_URL } from './env.js';

let redisClient;

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
  return redisClient;
}

export async function closeRedis() {
  if (redisClient?.isOpen) await redisClient.quit();
}
