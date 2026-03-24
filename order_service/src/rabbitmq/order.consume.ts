import { OrderService } from '../service/order.service.js';
import { consume } from './consume.js';

async function startPaymentSuccessConsumer(orderService: OrderService) {
  try {
    await consume('payment.success', async (msg) => {
      let paymentResult: { orderId: string; paymentId: string; amount: number };

      try {
        paymentResult = JSON.parse(msg.toString());
      } catch (error) {
        throw new Error(`Invalid JSON in payment.success message: ${error}`);
      }

      if (!paymentResult.orderId) {
        throw new Error(`Invalid payment result: missing orderId`);
      }

      await orderService.UpdateOrderStatus(paymentResult.orderId, 'success');
      console.log(`Order ${paymentResult.orderId} marked as paid`);
    });
  } catch (error) {
    console.error('Failed to start payment.success consumer:', error);
    throw error;
  }
}

async function startPaymentFailedConsumer(orderService: OrderService) {
  try {
    await consume('payment.failed', async (msg) => {
      let paymentResult: { orderId: string; paymentId: string; amount: number };

      try {
        paymentResult = JSON.parse(msg.toString());
      } catch (error) {
        throw new Error(`Invalid JSON in payment.failed message: ${error}`);
      }

      if (!paymentResult.orderId) {
        throw new Error(`Invalid payment result: missing orderId`);
      }

      await orderService.UpdateOrderStatus(paymentResult.orderId, 'failed');
      console.log(`Order ${paymentResult.orderId} payment failed`);
    });
  } catch (error) {
    console.error('Failed to start payment.failed consumer:', error);
    throw error;
  }
}

export const startConsumers = async (orderService: OrderService) => {
  try {
    await Promise.all([
      startPaymentSuccessConsumer(orderService),
      startPaymentFailedConsumer(orderService),
    ]);
    console.log('All order service consumers started successfully');
  } catch (error) {
    console.error('Error starting consumers:', error);
    throw error;
  }
};
