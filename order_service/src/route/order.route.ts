import { Router } from 'express';
import { OrderController } from '../controller/order.controller.js';

export const createOrderRoute = (orderController: OrderController) => {
  const route = Router();

  route.get('/', orderController.GetOrder.bind(orderController));
  route.post('/', orderController.CreateOrder.bind(orderController));
  route.put('/pay/:id', orderController.PayOrder.bind(orderController));
  route.get('/:orderId', orderController.GetOrderbyID.bind(orderController));
  route.put('/:id', orderController.UpdateOrder.bind(orderController));

  return route;
};
