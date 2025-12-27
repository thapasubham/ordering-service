import { Redis } from 'ioredis';

class RedisClient {
  private client: Redis;
  constructor() {
    this.client = new Redis({
      host: 'localhost',
      port: 6379,
      password: 'coolPasscode',
      username: 'default',
    });
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
    console.log(data);
    return data.filter((item) => item !== null);
  }
}

export const redisClient = new RedisClient();
