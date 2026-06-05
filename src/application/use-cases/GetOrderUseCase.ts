import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CachePort } from '../ports/out/CachePort';
import { OrderResponseDto } from '../dtos/OrderDto';
import { OrderMapper } from './OrderMapper';
import { Logger } from '../../infrastructure/http/middlewares/Logger';

export class GetOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cache: CachePort,
    private readonly logger: Logger,
  ) {}

  async execute(orderId: string): Promise<OrderResponseDto> {
    const cacheKey = `orders:${orderId}`;

    const cached = await this.cache.get<OrderResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug('Order cache hit', { orderId });
      return cached;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const dto = OrderMapper.toDto(order);
    await this.cache.set(cacheKey, dto, 300); // 5 min TTL

    return dto;
  }
}
