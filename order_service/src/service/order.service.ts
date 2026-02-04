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

  async RequestPayment(orderId: string) {
    const order: Order = await this.orderRepo.GetOrderById(orderId);

    if (order.Status !== 'pending') {
      throw new Error(
        `Order ${orderId} cannot be paid. Current status: ${order.Status}`
      );
    }

    // Publish payment request to payment service
    await publish('pay.order', {
      id: order.id,
      price: order.price,
      name: order.name,
      Status: order.Status,
    });

    return { message: 'Payment request sent', orderId: order.id };
  }

  async UpdateOrderStatus(orderId: string, status: 'success' | 'failed') {
    const order: Order = await this.orderRepo.GetOrderById(orderId);
    order.Status = status;
    order.updatedAt = new Date().toISOString();
    await this.orderRepo.UpdateOrder(order);
    return order;
  }
}
