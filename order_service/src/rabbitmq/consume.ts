import { rabbitclient } from '../client/rabbitmq.client.js';

export async function consume(
  queue_name: string,
  OnMessage: (msg: Buffer) => Promise<void>
) {
  const channel = await rabbitclient.getChannel();
  await channel.prefetch(1);

  await channel.assertExchange(`${queue_name}.dlx`, 'direct', {
    durable: true,
  });

  await channel.assertQueue(`${queue_name}.dlq`, { durable: true });

  await channel.bindQueue(
    `${queue_name}.dlq`,
    `${queue_name}.dlx`,
    `${queue_name}.dlq`
  );

  await channel.assertQueue(queue_name, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${queue_name}.dlx`,
      'x-dead-letter-routing-key': `${queue_name}.dlq`,
    },
  });

  console.log('Consuming from queue:', queue_name);

  channel.consume(
    queue_name,
    async (msg) => {
      if (!msg) return;

      try {
        await OnMessage(msg.content);
        channel.ack(msg);
      } catch (error) {
        console.error('Processing failed:', error);

        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}
