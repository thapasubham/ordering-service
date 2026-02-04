import { rabbitclient } from '../client/rabbitmq.client.js';

export async function publish<T>(
  queue_name: string,
  value: T
): Promise<boolean> {
  try {
    const channel = await rabbitclient.getChannel();

    const dlxName = `${queue_name}.dlx`;
    const routingKey = `${queue_name}.dlq`;

    try {
      await channel.assertExchange(dlxName, 'direct', { durable: true });
      await channel.assertQueue(`${queue_name}.dlq`, { durable: true });
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

    const published = channel.sendToQueue(
      queue_name,
      Buffer.from(JSON.stringify(value)),
      { persistent: true }
    );

    if (!published) {
      throw new Error(`Failed to publish message to queue: ${queue_name}`);
    }

    const messageId =
      typeof value === 'object' && value !== null && 'id' in value
        ? String((value as { id: unknown }).id)
        : typeof value === 'object' && value !== null && 'orderId' in value
          ? String((value as { orderId: unknown }).orderId)
          : 'N/A';

    console.log(`Published to ${queue_name}`, {
      queue: queue_name,
      messageId,
    });

    return true;
  } catch (error) {
    console.error(`Failed to publish to ${queue_name}:`, error);
    throw error;
  }
}
