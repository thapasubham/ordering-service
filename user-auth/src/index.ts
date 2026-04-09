import express, { Request, Response } from 'express';
import cors from 'cors';
import { mongoDBclient } from './client/mongoDB.client.js';
import { authRoute } from './route/auth.route.js';
import { config } from './config/config.js';

async function startServer() {
  const app = express();
  const PORT = config.PORT;

  app.use(express.json());
  app.use(cors());

  await mongoDBclient.Connect();

  app.get('/health', async (req: Request, res: Response) => {
    const isMongoHealthy = await mongoDBclient.health();
    res.status(200).json({
      status: 'ok',
      service: 'user-service',
      database: isMongoHealthy ? 'connected' : 'disconnected',
    });
  });

  app.use('/api', authRoute);

  app.listen(PORT, () => {
    console.log(`User-auth service running at localhost:${PORT}`);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

startServer();
