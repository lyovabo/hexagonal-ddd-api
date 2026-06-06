import { Module } from '@nestjs/common';
import { InfrastructureModule, ORDER_REPOSITORY, REDIS_CACHE, KAFKA_PUBLISHER } from '../infrastructure/infrastructure.module';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../../application/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/UpdateOrderStatusUseCase';
import { Logger } from '../../infrastructure/http/middlewares/Logger';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { EventPublisher } from '../../application/ports/out/EventPublisher';
import { CachePort } from '../../application/ports/out/CachePort';
import { NestOrderController } from './order.controller';

export const CREATE_ORDER_USE_CASE = 'CREATE_ORDER_USE_CASE';
export const GET_ORDER_USE_CASE = 'GET_ORDER_USE_CASE';
export const UPDATE_ORDER_STATUS_USE_CASE = 'UPDATE_ORDER_STATUS_USE_CASE';

@Module({
  imports: [InfrastructureModule],
  controllers: [NestOrderController],
  providers: [
    {
      provide: CREATE_ORDER_USE_CASE,
      useFactory: (repo: OrderRepository, publisher: EventPublisher, cache: CachePort) =>
        new CreateOrderUseCase(repo, publisher, cache, new Logger('create-order')),
      inject: [ORDER_REPOSITORY, KAFKA_PUBLISHER, REDIS_CACHE],
    },
    {
      provide: GET_ORDER_USE_CASE,
      useFactory: (repo: OrderRepository, cache: CachePort) =>
        new GetOrderUseCase(repo, cache, new Logger('get-order')),
      inject: [ORDER_REPOSITORY, REDIS_CACHE],
    },
    {
      provide: UPDATE_ORDER_STATUS_USE_CASE,
      useFactory: (repo: OrderRepository, publisher: EventPublisher, cache: CachePort) =>
        new UpdateOrderStatusUseCase(repo, publisher, cache, new Logger('update-order-status')),
      inject: [ORDER_REPOSITORY, KAFKA_PUBLISHER, REDIS_CACHE],
    },
  ],
})
export class OrderModule {}
