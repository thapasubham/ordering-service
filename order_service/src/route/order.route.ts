import { Router } from 'express';
import { OrderController } from '../controller/order.controller.js';
import { OrderService } from '../service/order.service.js';

const route = Router();
const orderService = new OrderService();
const orderController = new OrderController(orderService);
route.get('/', orderController.GetOrder.bind(orderController));
route.post('/', orderController.CreateOrder.bind(orderController));

export const orderRoute = route;
