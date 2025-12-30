import { publish } from '../rabbitmq/publisher.js';
import { OrderRepository } from '../repository/order.repository.js';
import { Order } from '../types/order.types.js';

export class OrderService {
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
