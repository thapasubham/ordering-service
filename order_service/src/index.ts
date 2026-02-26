import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { orderRoute } from './route/order.route.js';
import { rabbitclient } from './client/rabbitmq.client.js';
import { consumers } from './rabbitmq/order.consume.js';
import { redisClient } from './client/redis.client.js';
import cors from 'cors';
dotenv.config();

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3001;
    const API_GATEWAY_URL = process.env.API_GATEWAY || 'http://localhost:3067';
    app.use(express.json());

    app.use(cors({ origin: API_GATEWAY_URL, methods: '*' }));
    try {
      await rabbitclient.connect();
    } catch {
      console.error('Failed to connect to RabbitMQ. Server will not start.');
      process.exit(1);
    }

    try {
      await consumers();
    } catch (error) {
      console.error('Failed to start consumers:', error);
    }

    app.use('/api/order', orderRoute);

    app.get('/health', async (req: Request, res: Response) => {
      const rabbitHealth = await rabbitclient.checkConnection();
      const redisHealth = await redisClient.healthCheck();
      res.status(200).json({
        status: 'ok',
        service: 'order-service',
        rabbitHealth: rabbitHealth ? 'Ok' : 'Degraded',
        redisHealth: redisHealth ? 'Ok' : 'Degraded',
      });
    });

    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        message: `Route ${req.path} not found`,
      });
    });

    app.listen(PORT, () => {
      console.log(`Ordering service running at localhost:${PORT}`);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await rabbitclient.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await rabbitclient.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
