import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  abstract readonly eventName: string;

  constructor() {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
  }
}
