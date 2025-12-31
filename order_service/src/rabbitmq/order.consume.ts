import { OrderRepository } from '../repository/order.repository.js';
import { Order } from '../types/order.types.js';
import { consume } from './consume.js';

const orderRepo = new OrderRepository();

async function startOrderConsumer() {
  await consume('create.order', async (msg) => {
    const order: Order = JSON.parse(msg.toString());

    await orderRepo.CreateOrder(order);

    console.log('Order saved:', order.id);
  });
}

async function startPaymentConsumer() {
  await consume('pay.order', async (msg) => {
    const order: Order = JSON.parse(msg.toString());
    await orderRepo.UpdateOrder(order);
    console.log('order update:', order);
  });
}

export const consumers = () => {
  startOrderConsumer();
  startPaymentConsumer();
};
