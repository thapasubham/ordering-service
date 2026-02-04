import amqp from 'amqplib';
import { Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class RabbitClient {
  private channel!: Channel;
  private connection!: Awaited<ReturnType<typeof amqp.connect>>;

  async connect() {
    const url =
      process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    this.connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err);
    });

    this.connection.on('close', () => {
      console.log('RabbitMQ connection closed');
    });

    console.log('Connected to RabbitMQ');
  }
  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('Disconnected from RabbitMQ');
    } catch {
      console.log('Disconnected from RabbitMQ');
    }
  }

  async checkConnection() {
    try {
      const url =
        process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
      const connection = await amqp.connect(url);
      console.log('RabbitMQ connected successfully');

      await connection.close();
      return true;
    } catch (err: unknown) {
      console.error('RabbitMQ connection failed:', err);
      return false;
    }
  }

  async getChannel(): Promise<Channel> {
    if (!this.channel || !this.connection) {
      await this.connect();
    }
    return this.channel;
  }
}

export const rabbitclient = new RabbitClient();
