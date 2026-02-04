import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { paymentRoute } from './route/payment.route.js';
import { rabbitclient } from './client/rabbitmq.client.js';
import { consumers } from './rabbitmq/payment.consume.js';
import { redisClient } from './client/redis.client.js';

dotenv.config();

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3002;

    app.use(express.json());

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

    app.use('/api/payment', paymentRoute);

    app.get('/health', async (req: Request, res: Response) => {
      const rabbitHealth = await rabbitclient.checkConnection();
      const redisHealth = await redisClient.healthCheck();
      res.status(200).json({
        status: 'ok',
        service: 'payment-service',
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
      console.log(`Payment service running at localhost:${PORT}`);
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
