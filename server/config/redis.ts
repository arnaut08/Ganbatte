import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'socket.io';
import { REDIS_URL } from './env.js';

let redisClient: ReturnType<typeof createClient> | undefined;
let redisSubscriber: ReturnType<typeof createClient> | undefined;
const USER_CONNECTION_TTL_SECONDS = 15 * 60;

const memoryConnections = new Map<string, { socketId: string; expiresAt: number }>();
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

/** Configures Redis Adapter with IPv4 binding & connection resilience */
export async function configureRedisAdapter(io: Server): Promise<ReturnType<typeof createClient> | null> {
  if (!isRedisConfigured()) {
    console.warn('REDIS_URL is not configured; using the in-memory Socket.io adapter.');
    return null;
  }

  const isTls = REDIS_URL.startsWith('rediss://');

  const clientOptions = {
    url: REDIS_URL,
    socket: {
      family: 4 as const, // Force IPv4 to prevent IPv6 DNS hangs on Render internal network
      connectTimeout: 10000,
      keepAlive: 5000,
      reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000),
      ...(isTls && {
        tls: true,
        rejectUnauthorized: false,
      }),
    },
  };

  const pubClient = createClient(clientOptions);
  const subClient = pubClient.duplicate();

  pubClient.on('error', (error) => console.error('Redis publisher error:', error));
  subClient.on('error', (error) => console.error('Redis subscriber error:', error));

  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    redisClient = pubClient;
    redisSubscriber = subClient;
    console.log('Redis Socket.io adapter configured successfully.');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis adapter, falling back to in-memory:', error);
    return null;
  }
}