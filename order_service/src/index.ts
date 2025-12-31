import express, { Request, Response, NextFunction } from 'express';
import { orderRoute } from './route/order.route.js';
import { rabbitclient } from './client/rabbitmq.client.js';
import { consumers } from './rabbitmq/order.consume.js';
async function startServer() {
  const app = express();

  app.use(express.json());
  await rabbitclient.connect();
  app.use('/api/order', orderRoute);
  consumers();
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  });
  app.listen(3001, () => {
    console.log('Ordering service running at localhost:3001');
  });
}

startServer();
