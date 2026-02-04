import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service.js';
import { PaymentRequest } from '../types/payment.types.js';

export class PaymentController {
  public paymentService: PaymentService;

  public constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  async ProcessPayment(req: Request, res: Response) {
    try {
      const paymentRequest: PaymentRequest = req.body;

      if (!paymentRequest.orderId || !paymentRequest.amount) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Missing required fields: orderId and amount',
        });
      }

      if (paymentRequest.amount <= 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Amount must be greater than 0',
        });
      }

      const payment = await this.paymentService.ProcessPayment(paymentRequest);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async GetPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Payment ID is required',
        });
      }
      const payment = await this.paymentService.GetPayment(id);
      res.status(200).json(payment);
    } catch (error) {
      if (error instanceof Error && error.message === 'Payment not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async GetPayments(req: Request, res: Response) {
    try {
      const payments = await this.paymentService.GetPayments();
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async GetPaymentsByOrderId(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Order ID is required',
        });
      }
      const payments = await this.paymentService.GetPaymentsByOrderId(orderId);
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
