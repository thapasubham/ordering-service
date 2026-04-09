import { mongoDBclient } from '../client/mongoDB.client.js';
import { Order } from '../types/order.types.js';
import { WithId } from 'mongodb';

export class OrderRepository {
  async GetOrderById(id: string) {
    const result = (await mongoDBclient.getById(id)) as WithId<Order>;
    if (!result) {
      throw new Error('Order not found');
    }
    return result;
  }

  async GetOrder() {
    return await mongoDBclient.get();
  }

  async CreateOrder(order: Order) {
    order.Status = 'pending';
    order.createdAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return await mongoDBclient.add<Order>(order);
  }

  async UpdateOrder(id: string, order: Partial<Order>) {
    order.updatedAt = new Date().toISOString();
    return await mongoDBclient.update<Order>(id, order);
  }
}
