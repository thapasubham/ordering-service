import express, { Request, Response, NextFunction } from 'express';
import { orderRoute } from './route/order.route.js';
function startServer() {
  const app = express();

  app.use(express.json());

  app.use('/api/order', orderRoute);

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
