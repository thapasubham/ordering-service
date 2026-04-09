import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { paymentRoute } from './route/payment.route.js';
import { rabbitclient } from './client/rabbitmq.client.js';
import { consumers } from './rabbitmq/payment.consume.js';
import { mongoDBclient } from './client/mongoDB.client.js';
import cors from 'cors';

async function startServer() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3002;
    const API_GATEWAY_URL = process.env.API_GATEWAY || 'http://localhost:3067';
    app.use(express.json());

    app.use(cors({ origin: API_GATEWAY_URL, methods: '*' }));

    try {
      await rabbitclient.connect();
      await mongoDBclient.Connect();
      console.log('Infrastructure connected');
    } catch (err) {
      console.error('Failed to connect to infrastructure:', err);
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
      const mongoHealth = await mongoDBclient.health();
      res.status(200).json({
        status: 'ok',
        service: 'payment-service',
        rabbitHealth: rabbitHealth ? 'Ok' : 'Degraded',
        mongoHealth: mongoHealth ? 'Ok' : 'Degraded',
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
      await mongoDBclient.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await rabbitclient.disconnect();
      await mongoDBclient.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
