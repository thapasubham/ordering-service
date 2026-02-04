import { PaymentService } from '../service/payment.service.js';
import { consume } from './consume.js';

type OrderMessage = {
  id: string;
  price: number;
  name?: string;
  Status?: string;
};

const paymentService = new PaymentService();

async function startPaymentRequestConsumer() {
  try {
    await consume('pay.order', async (msg) => {
      let order: OrderMessage;

      try {
        order = JSON.parse(msg.toString());
      } catch (error) {
        throw new Error(`Invalid JSON in pay.order message: ${error}`);
      }

      if (!order.id || !order.price) {
        throw new Error(`Invalid order data: missing required fields`);
      }

      await paymentService.ProcessPayment({
        orderId: order.id,
        amount: order.price,
      });

      console.log(`Payment processed for order: ${order.id}`);
    });
  } catch (error) {
    console.error('Failed to start pay.order consumer:', error);
    throw error;
  }
}

export const consumers = async () => {
  try {
    await startPaymentRequestConsumer();
    console.log('Payment service consumers started successfully');
  } catch (error) {
    console.error('Error starting payment consumers:', error);
    throw error;
  }
};
