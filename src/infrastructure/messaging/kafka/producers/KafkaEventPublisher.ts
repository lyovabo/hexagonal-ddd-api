import { Kafka, Producer, CompressionTypes, logLevel } from 'kafkajs';
import { EventPublisher } from '../../../../application/ports/out/EventPublisher';
import { DomainEvent } from '../../../../domain/events/DomainEvent';
import { config } from '../../../../config';

export class KafkaEventPublisher implements EventPublisher {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private connected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: config.kafka.retry,
      logLevel: logLevel.WARN,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    this.connected = true;
    console.log('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    await this.producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: event.eventId,
          value: JSON.stringify({
            eventId: event.eventId,
            eventName: event.eventName,
            occurredOn: event.occurredOn,
            payload: event,
          }),
          headers: {
            'event-name': event.eventName,
            'event-id': event.eventId,
            'occurred-on': event.occurredOn.toISOString(),
          },
        },
      ],
    });
  }

  async publishBatch(topic: string, events: DomainEvent[]): Promise<void> {
    await this.producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: events.map(event => ({
        key: event.eventId,
        value: JSON.stringify({
          eventId: event.eventId,
          eventName: event.eventName,
          occurredOn: event.occurredOn,
          payload: event,
        }),
        headers: {
          'event-name': event.eventName,
          'event-id': event.eventId,
        },
      })),
    });
  }

  async checkHealth(): Promise<boolean> {
    return this.connected;
  }
}

let kafkaPublisherInstance: KafkaEventPublisher | null = null;

export function getKafkaPublisher(): KafkaEventPublisher {
  if (!kafkaPublisherInstance) {
    kafkaPublisherInstance = new KafkaEventPublisher();
  }
  return kafkaPublisherInstance;
}
