import { OrderRepository } from '../repository/order.repository.js';
import { OrderService } from '../service/order.service.js';
import { Order } from '../types/order.types.js';
import { consume } from './consume.js';

const orderRepo = new OrderRepository();
const orderService = new OrderService();

async function startOrderConsumer() {
  try {
    await consume('create.order', async (msg) => {
      let order: Order;

      try {
        order = JSON.parse(msg.toString());
      } catch (error) {
        throw new Error(`Invalid JSON in create.order message: ${error}`);
      }

      if (!order.id || !order.name || order.price === undefined) {
        throw new Error(`Invalid order data: missing required fields`);
      }

      await orderRepo.CreateOrder(order);
      console.log(`Order saved: ${order.id}`);
    });
  } catch (error) {
    console.error('Failed to start create.order consumer:', error);
    throw error;
  }
}

async function startPaymentSuccessConsumer() {
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

async function startPaymentFailedConsumer() {
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

export const consumers = async () => {
  try {
    await Promise.all([
      startOrderConsumer(),
      startPaymentSuccessConsumer(),
      startPaymentFailedConsumer(),
    ]);
    console.log('All order service consumers started successfully');
  } catch (error) {
    console.error('Error starting consumers:', error);
    throw error;
  }
};
