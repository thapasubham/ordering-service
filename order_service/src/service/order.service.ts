import { publish } from '../rabbitmq/publisher.js';
import { OrderRepository } from '../repository/order.repository.js';
import { Order } from '../types/order.types.js';

export class OrderService {
  private orderRepo: OrderRepository;

  constructor(orderRepo: OrderRepository) {
    this.orderRepo = orderRepo;
  }
  async GetOrderByID(id: string): Promise<Order> {
    const result = await this.orderRepo.GetOrderById(id);
    return result;
  }
  async GetOrder() {
    const result = await this.orderRepo.GetOrder();
    return result;
  }

  async CreateOrder(order: Order) {
    await this.orderRepo.CreateOrder(order);
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
      _id: order._id,
      price: order.price,
      name: order.name,
      Status: order.Status,
    });

    return { message: 'Payment request sent', orderId: order._id };
  }
  async UpdateOrder(orderId: string, order: Partial<Order>) {
    const result = await this.orderRepo.UpdateOrder(orderId, order);
    return result;
  }
  async UpdateOrderStatus(orderId: string, status: 'success' | 'failed') {
    await this.orderRepo.UpdateOrder(orderId, { Status: status });
    const order = await this.orderRepo.GetOrderById(orderId);
    return order;
  }
}
