import express from 'express';
import { orderRoute } from './route/order.route.js';
function startServer() {
  const app = express();

  app.use(express.json());

  app.use('/api/order', orderRoute);
  app.listen(3001, () => {
    console.log('Ordering service running at localhost:3001');
  });
}

startServer();
