import express, { Request, Response } from 'express';
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3003;

  app.get('/health', async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'user-service',
    });
  });
  app.listen(PORT, () => {
    console.log(`Ordering service running at localhost:${PORT}`);
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
