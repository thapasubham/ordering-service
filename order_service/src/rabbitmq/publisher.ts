import { rabbitclient } from '../client/rabbitmq.client.js';

export async function publish<T>(queue_name: string, value: T) {
  const channel = await rabbitclient.getChannel();

  const published = channel.sendToQueue(
    queue_name,
    Buffer.from(JSON.stringify(value)),
    { persistent: true }
  );

  if (!published) {
    throw new Error('Failed to publish message');
  }

  console.log('Published %s to %s', value, queue_name);
}
