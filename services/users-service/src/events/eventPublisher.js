import amqp from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

const EXCHANGE_NAME =
  process.env.RABBITMQ_EXCHANGE || "facoffee.events";

export async function publishEvent(routingKey, payload) {
  let connection;
  let channel;

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
      durable: true
    });

    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json"
      }
    );
  } catch (error) {
    console.error("Erro ao publicar evento no RabbitMQ:", error.message);
  } finally {
    if (channel) {
      await channel.close().catch(() => {});
    }

    if (connection) {
      await connection.close().catch(() => {});
    }
  }
}