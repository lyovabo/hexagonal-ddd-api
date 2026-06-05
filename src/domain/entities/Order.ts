import { Entity } from './Entity';
import { Money } from '../value-objects/Money';
import { OrderStatus } from '../value-objects/OrderStatus';
import { OrderItem } from '../value-objects/OrderItem';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';
import { OrderStatusChangedEvent } from '../events/OrderStatusChangedEvent';

export interface OrderProps {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: Money;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  static create(customerId: string, items: OrderItem[]): Order {
    if (!customerId) throw new Error('Customer ID is required');
    if (!items || items.length === 0) throw new Error('Order must have at least one item');

    const total = Money.sum(items.map(i => i.subtotal));
    const now = new Date();

    const order = new Order({
      customerId,
      items,
      status: OrderStatus.PENDING,
      total,
      createdAt: now,
      updatedAt: now,
    });

    order.addDomainEvent(new OrderCreatedEvent(order.id, customerId, total.amount));
    return order;
  }

  static reconstitute(props: OrderProps, id: string): Order {
    return new Order(props, id);
  }

  confirm(): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new Error(`Cannot confirm order in status: ${this.props.status}`);
    }
    const previous = this.props.status;
    this.props.status = OrderStatus.CONFIRMED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new OrderStatusChangedEvent(this.id, previous, OrderStatus.CONFIRMED));
  }

  ship(): void {
    if (this.props.status !== OrderStatus.CONFIRMED) {
      throw new Error(`Cannot ship order in status: ${this.props.status}`);
    }
    const previous = this.props.status;
    this.props.status = OrderStatus.SHIPPED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new OrderStatusChangedEvent(this.id, previous, OrderStatus.SHIPPED));
  }

  cancel(): void {
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(this.props.status)) {
      throw new Error(`Cannot cancel order in status: ${this.props.status}`);
    }
    const previous = this.props.status;
    this.props.status = OrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new OrderStatusChangedEvent(this.id, previous, OrderStatus.CANCELLED));
  }

  get customerId(): string { return this.props.customerId; }
  get items(): OrderItem[] { return this.props.items; }
  get status(): OrderStatus { return this.props.status; }
  get total(): Money { return this.props.total; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
