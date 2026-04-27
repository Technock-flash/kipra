import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;

// Helper functions for session/token management
export const redisHelpers = {
  async setRefreshToken(userId: string, token: string, expiresIn: number = 7 * 24 * 60 * 60) {
    await redis.setex(`refresh_token:${userId}`, expiresIn, token);
  },

  async getRefreshToken(userId: string): Promise<string | null> {
    return redis.get(`refresh_token:${userId}`);
  },

  async deleteRefreshToken(userId: string) {
    await redis.del(`refresh_token:${userId}`);
  },

  async blacklistToken(token: string, expiresIn: number) {
    await redis.setex(`blacklist:${token}`, expiresIn, '1');
  },

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  },

  async setLoginAttempts(ip: string, attempts: number, windowSeconds: number = 900) {
    await redis.setex(`login_attempts:${ip}`, windowSeconds, attempts.toString());
  },

  async getLoginAttempts(ip: string): Promise<number> {
    const attempts = await redis.get(`login_attempts:${ip}`);
    return attempts ? parseInt(attempts, 10) : 0;
  },

  async incrementLoginAttempts(ip: string, windowSeconds: number = 900) {
    const key = `login_attempts:${ip}`;
    const exists = await redis.exists(key);
    if (!exists) {
      await redis.setex(key, windowSeconds, '1');
      return 1;
    }
    return redis.incr(key);
  },

  async setLockout(ip: string, durationMinutes: number = 30) {
    await redis.setex(`lockout:${ip}`, durationMinutes * 60, '1');
  },

  async isLockedOut(ip: string): Promise<boolean> {
    const result = await redis.get(`lockout:${ip}`);
    return result === '1';
  },

  async cacheData(key: string, data: any, expiresIn: number = 300) {
    await redis.setex(key, expiresIn, JSON.stringify(data));
  },

  async getCachedData(key: string): Promise<any | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async invalidateCache(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

