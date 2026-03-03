import { Request, Response } from 'express';
import { OrderService } from '../service/order.service.js';
import { Order } from '../types/order.types.js';
import { nanoid } from 'nanoid';
export class OrderController {
  public orderService: OrderService;
  public constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  async GetOrder(req: Request, res: Response) {
    const result = await this.orderService.GetOrder();
    res.send(result).status(200);
  }
  async CreateOrder(req: Request, res: Response) {
    const order: Order = req.body;
    if (!req.body) {
      res.send('Empty body will not be accepted.').status(204);
      return;
    }
    order.id = nanoid();
    const result = await this.orderService.CreateOrder(order);
    res.send(result).status(200);
  }

  async PayOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Order ID is required',
        });
      }

      const result = await this.orderService.RequestPayment(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error requesting payment:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes('cannot be paid')) {
        return res.status(400).json({
          error: 'Bad request',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async GetOrderbyID(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Order ID is required',
        });
      }
      const order: Order = await this.orderService.GetOrderByID(orderId);
      res.send(order).status(200);
    } catch (error) {
      console.log(error);
      res.status(404).json({
        error: 'Not found.',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
