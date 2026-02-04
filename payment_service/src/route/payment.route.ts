import { Router } from 'express';
import { PaymentController } from '../controller/payment.controller.js';
import { PaymentService } from '../service/payment.service.js';

const route = Router();
const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

route.post('/', paymentController.ProcessPayment.bind(paymentController));
route.get('/', paymentController.GetPayments.bind(paymentController));
route.get('/:id', paymentController.GetPayment.bind(paymentController));
route.get(
  '/order/:orderId',
  paymentController.GetPaymentsByOrderId.bind(paymentController)
);

export const paymentRoute = route;
