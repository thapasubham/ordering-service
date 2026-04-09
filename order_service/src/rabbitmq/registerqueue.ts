import { rabbitclient } from '../client/rabbitmq.client.js';

export async function setupQueues(queue_name: string) {
  const channel = await rabbitclient.getChannel();
  const dlxName = `${queue_name}.dlx`;
  const routingKey = `${queue_name}.dlq`;

  try {
    await channel.assertExchange(dlxName, 'direct', { durable: true });
    await channel.assertQueue(`${queue_name}.dlq`, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '', // default exchange
        'x-dead-letter-routing-key': queue_name, // send back to main queue
      },
    });
    await channel.bindQueue(`${queue_name}.dlq`, dlxName, routingKey);

    await channel.assertQueue(queue_name, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName,
        'x-dead-letter-routing-key': routingKey,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 406
    ) {
      console.log(
        `Queue ${queue_name} already exists with different settings, sending anyway`
      );
    } else {
      throw error;
    }
  }
}
