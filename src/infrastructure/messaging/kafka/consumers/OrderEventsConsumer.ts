import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { config } from '../../../../config';

export class OrderEventsConsumer {
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: `${config.kafka.clientId}-consumer`,
      brokers: config.kafka.brokers,
      logLevel: logLevel.WARN,
    });

    this.consumer = this.kafka.consumer({
      groupId: config.kafka.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: ['orders.order.created', 'orders.order.status_changed'],
      fromBeginning: false,
    });
    console.log('Kafka consumer connected and subscribed to order topics');
  }

  async start(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    if (!message.value) return;

    try {
      const event = JSON.parse(message.value.toString());
      console.log(`Received event [${topic}]:`, event.eventName);

      switch (topic) {
        case 'orders.order.created':
          await this.handleOrderCreated(event.payload);
          break;
        case 'orders.order.status_changed':
          await this.handleOrderStatusChanged(event.payload);
          break;
        default:
          console.warn(`Unhandled topic: ${topic}`);
      }
    } catch (err) {
      console.error(`Failed to process message from topic ${topic}:`, err);
      // In production: send to DLQ (Dead Letter Queue)
    }
  }

  private async handleOrderCreated(payload: any): Promise<void> {
    // Add notification logic, analytics, etc.
    console.log('Processing order.created event:', payload.orderId);
  }

  private async handleOrderStatusChanged(payload: any): Promise<void> {
    console.log(
      `Order ${payload.orderId} status changed: ${payload.previousStatus} → ${payload.newStatus}`,
    );
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
