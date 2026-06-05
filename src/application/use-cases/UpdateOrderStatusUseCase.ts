import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../ports/out/EventPublisher';
import { CachePort } from '../ports/out/CachePort';
import { OrderResponseDto } from '../dtos/OrderDto';
import { OrderMapper } from './OrderMapper';
import { Logger } from '../../infrastructure/http/middlewares/Logger';

type StatusAction = 'confirm' | 'ship' | 'cancel';

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly cache: CachePort,
    private readonly logger: Logger,
  ) {}

  async execute(orderId: string, action: StatusAction): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    switch (action) {
      case 'confirm': order.confirm(); break;
      case 'ship':    order.ship();    break;
      case 'cancel':  order.cancel();  break;
      default: throw new Error(`Unknown action: ${action}`);
    }

    await this.orderRepository.update(order);

    for (const event of order.domainEvents) {
      await this.eventPublisher.publish(`orders.${event.eventName}`, event);
    }
    order.clearDomainEvents();

    await this.cache.delete(`orders:${orderId}`);
    await this.cache.invalidatePattern(`orders:customer:${order.customerId}:*`);

    this.logger.info('Order status updated', { orderId, action });
    return OrderMapper.toDto(order);
  }
}
