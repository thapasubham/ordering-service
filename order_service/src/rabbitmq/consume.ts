import { rabbitclient } from '../client/rabbitmq.client.js';

export async function consume(
  queue_name: string,
  OnMessage: (msg: Buffer) => Promise<void>
) {
  const channel = await rabbitclient.getChannel();
  await channel.prefetch(1);

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
