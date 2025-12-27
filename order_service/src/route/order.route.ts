import { Router } from 'express';
import { Order } from '../controller/order.controller.js';

const route = Router();
const orderController = new Order();
route.get('/', orderController.GetOrder);

export const orderRoute = route;
