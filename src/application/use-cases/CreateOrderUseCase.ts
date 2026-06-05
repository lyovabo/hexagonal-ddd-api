import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/value-objects/OrderItem';
import { Money } from '../../domain/value-objects/Money';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import { CachePort } from '../ports/out/CachePort';
import { CreateOrderDto, OrderResponseDto } from '../dtos/OrderDto';
import { OrderMapper } from './OrderMapper';
import { Logger } from '../../infrastructure/http/middlewares/Logger';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly cache: CachePort,
    private readonly logger: Logger,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderResponseDto> {
    this.logger.info('Creating order', { customerId: dto.customerId });

    const items = dto.items.map(i =>
      OrderItem.create(
        i.productId,
        i.productName,
        i.quantity,
        Money.of(i.unitPrice, i.currency ?? 'USD'),
      ),
    );

    const order = Order.create(dto.customerId, items);

    await this.orderRepository.save(order);

    // Publish domain events to Kafka
    for (const event of order.domainEvents) {
      await this.eventPublisher.publish(`orders.${event.eventName}`, event);
    }
    order.clearDomainEvents();

    // Invalidate customer orders cache
    await this.cache.invalidatePattern(`orders:customer:${dto.customerId}:*`);

    this.logger.info('Order created successfully', { orderId: order.id });
    return OrderMapper.toDto(order);
  }
}
