import { Payment } from '../types/payment.types.js';
import { redisClient } from '../client/redis.client.js';

const paymentPrefix = 'payment';

export class PaymentRepository {
  async GetPaymentById(id: string) {
    const result = await redisClient.getById(paymentPrefix, id);
    if (!result) {
      throw new Error('Payment not found');
    }
    return result;
  }

  async GetPayments() {
    return await redisClient.get(paymentPrefix);
  }

  async GetPaymentsByOrderId(orderId: string) {
    const payments = await redisClient.get(paymentPrefix);
    return payments.filter((p: Payment) => p.orderId === orderId);
  }

  async CreatePayment(payment: Payment) {
    payment.status = 'pending';
    payment.createdAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();
    const key = `${paymentPrefix}:${payment.id}`;
    return await redisClient.add<Payment>(key, payment);
  }

  async UpdatePayment(payment: Payment) {
    payment.updatedAt = new Date().toISOString();
    const key = `${paymentPrefix}:${payment.id}`;
    return await redisClient.add<Payment>(key, payment);
  }
}
