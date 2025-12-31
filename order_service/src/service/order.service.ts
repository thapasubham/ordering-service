import { publish } from '../rabbitmq/publisher.js';
import { OrderRepository } from '../repository/order.repository.js';
import { Order } from '../types/order.types.js';

export class OrderService {
  async PayOrder(id: string) {
    const order: Order = await this.orderRepo.GetOrderById(id);
    order.Status = 'success';
    order.updatedAt = new Date().toISOString();
    await publish<Order>('pay.order', order);
  }
  private orderRepo: OrderRepository;
  constructor() {
    this.orderRepo = new OrderRepository();
  }
  async GetOrder() {
    const result = await this.orderRepo.GetOrder();
    return result;
  }

  async CreateOrder(order: Order) {
    await publish<Order>('create.order', order);
    return order;
  }
}
