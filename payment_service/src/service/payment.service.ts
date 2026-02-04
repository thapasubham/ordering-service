import { publish } from '../rabbitmq/publisher.js';
import { PaymentRepository } from '../repository/payment.repository.js';
import { Payment, PaymentRequest } from '../types/payment.types.js';
import { nanoid } from 'nanoid';

export class PaymentService {
  private paymentRepo: PaymentRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
  }

  async ProcessPayment(paymentRequest: PaymentRequest): Promise<Payment> {
    const payment: Payment = {
      id: nanoid(),
      orderId: paymentRequest.orderId,
      amount: paymentRequest.amount,
      paymentMethod: paymentRequest.paymentMethod || 'credit_card',
      status: 'processing',
    };

    await this.paymentRepo.CreatePayment(payment);

    // Simulate payment processing
    const success = await this.simulatePaymentProcessing(payment);

    if (success) {
      payment.status = 'success';
      await this.paymentRepo.UpdatePayment(payment);

      // Publish payment success event
      await publish('payment.success', {
        orderId: payment.orderId,
        paymentId: payment.id,
        amount: payment.amount,
      });
    } else {
      payment.status = 'failed';
      await this.paymentRepo.UpdatePayment(payment);

      // Publish payment failed event
      await publish('payment.failed', {
        orderId: payment.orderId,
        paymentId: payment.id,
        amount: payment.amount,
      });
    }

    return payment;
  }

  async GetPayment(id: string): Promise<Payment> {
    return await this.paymentRepo.GetPaymentById(id);
  }

  async GetPayments(): Promise<Payment[]> {
    return await this.paymentRepo.GetPayments();
  }

  async GetPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return await this.paymentRepo.GetPaymentsByOrderId(orderId);
  }

  private async simulatePaymentProcessing(payment: Payment): Promise<boolean> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(payment);
    // Simulate 90% success rate
    return Math.random() > 0.1;
  }
}
