import { DomainEvent } from './DomainEvent';

export class OrderCreatedEvent extends DomainEvent {
  readonly eventName = 'order.created';

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {
    super();
  }
}
