import { Order } from '../types/order.types.js';
import { redisClient } from '../client/redis.client.js';

const orderPrefix = 'order';
export class OrderRepository {
  async GetOrder() {
    return await redisClient.get(orderPrefix);
  }

  async CreateOrder(order: Order) {
    order.Status = 'pending';
    order.createdAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    const key = `${orderPrefix}:${order.id}`;
    return await redisClient.add<Order>(key, order);
  }
}
