import amqp from 'amqplib';
import { Channel } from 'amqplib';

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

class RabbitClient {
  private channel!: Channel;

  async connect() {
    const client = await amqp.connect(RABBITMQ_URL);
    this.channel = await client.createChannel();
    console.log('Connected to RabbitMQ');
  }
  async disconnect() {
    await this.channel.close();
    console.log('Disconnected from RabbitMQ');
  }

  async checkConnection() {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      console.log('RabbitMQ connected successfully');

      await connection.close();
      return true;
    } catch (err: unknown) {
      console.error('RabbitMQ connection failed:', err);
      return false;
    }
  }
  async getChannel() {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel;
  }
}

export const rabbitclient = new RabbitClient();
