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
    res.send(result);
  }
  async CreateOrder(req: Request, res: Response) {
    const order: Order = req.body;
    if (!req.body) {
      res.send('Empty body will not be accepted.').status(204);
      return;
    }
    order.id = nanoid();
    const result = await this.orderService.CreateOrder(order);
    res.send(result);
  }

  async PayOrder(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.orderService.PayOrder(id as string);
    res.send(result);
  }
}
