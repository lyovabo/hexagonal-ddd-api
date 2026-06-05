import { DomainEvent } from './DomainEvent';
import { OrderStatus } from '../value-objects/OrderStatus';

export class OrderStatusChangedEvent extends DomainEvent {
  readonly eventName = 'order.status_changed';

  constructor(
    public readonly orderId: string,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
  ) {
    super();
  }
}
