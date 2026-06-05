import { Order } from '../../src/domain/entities/Order';
import { OrderItem } from '../../src/domain/value-objects/OrderItem';
import { Money } from '../../src/domain/value-objects/Money';
import { OrderStatus } from '../../src/domain/value-objects/OrderStatus';
import { OrderCreatedEvent } from '../../src/domain/events/OrderCreatedEvent';
import { OrderStatusChangedEvent } from '../../src/domain/events/OrderStatusChangedEvent';

const makeItem = (qty = 2, price = 10) =>
  OrderItem.create('prod-1', 'Widget', qty, Money.of(price, 'USD'));

describe('Order', () => {
  describe('create', () => {
    it('creates an order with PENDING status', () => {
      const order = Order.create('cust-1', [makeItem()]);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.customerId).toBe('cust-1');
    });

    it('calculates the correct total', () => {
      const items = [makeItem(2, 10), makeItem(3, 5)];
      const order = Order.create('cust-1', items);
      expect(order.total.amount).toBe(35); // 2*10 + 3*5
    });

    it('emits OrderCreatedEvent', () => {
      const order = Order.create('cust-1', [makeItem()]);
      const events = order.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent);
    });

    it('throws without customerId', () => {
      expect(() => Order.create('', [makeItem()])).toThrow('Customer ID is required');
    });

    it('throws with empty items', () => {
      expect(() => Order.create('cust-1', [])).toThrow('at least one item');
    });
  });

  describe('lifecycle', () => {
    it('confirms a PENDING order', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.clearDomainEvents();
      order.confirm();
      expect(order.status).toBe(OrderStatus.CONFIRMED);
      expect(order.domainEvents[0]).toBeInstanceOf(OrderStatusChangedEvent);
    });

    it('ships a CONFIRMED order', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.confirm();
      order.clearDomainEvents();
      order.ship();
      expect(order.status).toBe(OrderStatus.SHIPPED);
    });

    it('cancels a PENDING order', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.cancel();
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('cannot confirm a non-PENDING order', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.confirm();
      expect(() => order.confirm()).toThrow('Cannot confirm');
    });

    it('cannot cancel a SHIPPED order', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.confirm();
      order.ship();
      expect(() => order.cancel()).toThrow('Cannot cancel');
    });

    it('clears domain events', () => {
      const order = Order.create('cust-1', [makeItem()]);
      order.clearDomainEvents();
      expect(order.domainEvents).toHaveLength(0);
    });
  });
});
