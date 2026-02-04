import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  private client: Redis;
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || 'coolPasscode',
      username: process.env.REDIS_USERNAME || 'default',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (err: unknown) {
      console.error('Redis health check failed:', err);
      return false;
    }
  }
  async add<T>(key: string, value: T) {
    return await this.client.set(key, JSON.stringify(value));
  }
  async get(key: string) {
    const keys = await this.client.keys(`${key}:*`);
    const data = await Promise.all(
      keys.map(async (key: string) => {
        const result = await this.client.get(key);
        return result ? JSON.parse(result) : null;
      })
    );
    return data.filter((item) => item !== null);
  }

  async getById(key: string, id: string) {
    const result = await this.client.get(`${key}:${id}`);
    return result ? JSON.parse(result) : null;
  }
}

export const redisClient = new RedisClient();
