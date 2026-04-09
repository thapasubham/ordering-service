import { rabbitclient } from '../client/rabbitmq.client.js';

export async function publish<T>(
  queue_name: string,
  value: T
): Promise<boolean> {
  try {
    const channel = await rabbitclient.getChannel();

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

    console.log(`✓ Published to ${queue_name}`, {
      queue: queue_name,
      messageId,
    });

    return true;
  } catch (error) {
    console.error(`✗ Failed to publish to ${queue_name}:`, error);
    throw error;
  }
}
