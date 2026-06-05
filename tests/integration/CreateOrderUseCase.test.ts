import { CreateOrderUseCase } from '../../src/application/use-cases/CreateOrderUseCase';
import { CreateOrderDto } from '../../src/application/dtos/OrderDto';
import { OrderRepository } from '../../src/domain/repositories/OrderRepository';
import { EventPublisher } from '../../src/application/ports/out/EventPublisher';
import { CachePort } from '../../src/application/ports/out/CachePort';
import { Logger } from '../../src/infrastructure/http/middlewares/Logger';
import { Order } from '../../src/domain/entities/Order';

// ── Mocks ─────────────────────────────────────────────────────
const mockRepository: jest.Mocked<OrderRepository> = {
  findById: jest.fn(),
  findByCustomerId: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

const mockPublisher: jest.Mocked<EventPublisher> = {
  publish: jest.fn(),
  publishBatch: jest.fn(),
};

const mockCache: jest.Mocked<CachePort> = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  invalidatePattern: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

// ── Tests ─────────────────────────────────────────────────────
describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.save.mockResolvedValue(undefined);
    mockPublisher.publish.mockResolvedValue(undefined);
    mockCache.invalidatePattern.mockResolvedValue(undefined);

    useCase = new CreateOrderUseCase(mockRepository, mockPublisher, mockCache, mockLogger);
  });

  const dto: CreateOrderDto = {
    customerId: 'cust-123',
    items: [
      { productId: 'prod-1', productName: 'Widget', quantity: 2, unitPrice: 9.99, currency: 'USD' },
    ],
  };

  it('creates an order and returns a DTO', async () => {
    const result = await useCase.execute(dto);

    expect(result.customerId).toBe('cust-123');
    expect(result.status).toBe('PENDING');
    expect(result.items).toHaveLength(1);
    expect(result.total.amount).toBe(19.98);
    expect(result.id).toBeDefined();
  });

  it('saves the order to the repository', async () => {
    await useCase.execute(dto);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('publishes an OrderCreatedEvent to Kafka', async () => {
    await useCase.execute(dto);
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'orders.order.created',
      expect.objectContaining({ eventName: 'order.created' }),
    );
  });

  it('invalidates the customer orders cache', async () => {
    await useCase.execute(dto);
    expect(mockCache.invalidatePattern).toHaveBeenCalledWith(
      `orders:customer:${dto.customerId}:*`,
    );
  });

  it('throws when items array is empty', async () => {
    await expect(useCase.execute({ ...dto, items: [] })).rejects.toThrow('at least one item');
  });
});
