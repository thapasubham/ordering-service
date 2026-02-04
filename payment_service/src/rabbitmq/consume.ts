import { rabbitclient } from '../client/rabbitmq.client.js';

export async function consume(
  queue_name: string,
  OnMessage: (msg: Buffer) => Promise<void>
) {
  try {
    const channel = await rabbitclient.getChannel();
    await channel.prefetch(1);

    const dlxName = `${queue_name}.dlx`;
    const dlqName = `${queue_name}.dlq`;
    const routingKey = `${queue_name}.dlq`;

    await channel.assertExchange(dlxName, 'direct', { durable: true });
    await channel.assertQueue(dlqName, { durable: true });
    await channel.bindQueue(dlqName, dlxName, routingKey);

    await channel.assertQueue(queue_name, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxName,
        'x-dead-letter-routing-key': routingKey,
      },
    });

    console.log(`✓ Consumer listening on queue: ${queue_name}`);

    channel.consume(
      queue_name,
      async (msg) => {
        if (!msg) return;

        try {
          await OnMessage(msg.content);
          channel.ack(msg);
          console.log(`✓ Message processed from ${queue_name}`);
        } catch (error) {
          console.error(
            `✗ Error processing message from ${queue_name}:`,
            error
          );
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(`✗ Failed to setup consumer for ${queue_name}:`, error);
    throw error;
  }
}
