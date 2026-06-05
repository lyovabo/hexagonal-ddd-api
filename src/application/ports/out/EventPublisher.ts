import { DomainEvent } from '../../../domain/events/DomainEvent';

export interface EventPublisher {
  publish(topic: string, event: DomainEvent): Promise<void>;
  publishBatch(topic: string, events: DomainEvent[]): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
