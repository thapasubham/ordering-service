import { Payment } from '../types/payment.types.js';
import { mongoDBclient } from '../client/mongoDB.client.js';
import { WithId } from 'mongodb';

export class PaymentRepository {
  async GetPaymentById(id: string) {
    const result = (await mongoDBclient.getById(id)) as WithId<Payment>;
    if (!result) {
      throw new Error('Payment not found');
    }
    return result;
  }

  async GetPayments() {
    return (await mongoDBclient.get()) as WithId<Payment>[];
  }

  async GetPaymentsByOrderId(orderId: string) {
    return (await mongoDBclient.get({ orderId })) as WithId<Payment>[];
  }

  async CreatePayment(payment: Payment) {
    payment.status = payment.status || 'pending';
    payment.createdAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();
    return await mongoDBclient.add<Payment>(payment);
  }

  async UpdatePayment(id: string, payment: Partial<Payment>) {
    payment.updatedAt = new Date().toISOString();
    return await mongoDBclient.update<Payment>(id, payment);
  }
}
