import { Module } from '@nestjs/common';
import { getPool } from '../../infrastructure/persistence/postgres/pool';
import { getRedisCache } from '../../infrastructure/persistence/redis/RedisCache';
import { getKafkaPublisher } from '../../infrastructure/messaging/kafka/producers/KafkaEventPublisher';
import { PostgresOrderRepository } from '../../infrastructure/persistence/postgres/repositories/PostgresOrderRepository';

export const POSTGRES_POOL = 'POSTGRES_POOL';
export const REDIS_CACHE = 'REDIS_CACHE';
export const KAFKA_PUBLISHER = 'KAFKA_PUBLISHER';
export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

@Module({
  providers: [
    { provide: POSTGRES_POOL, useFactory: () => getPool() },
    { provide: REDIS_CACHE, useFactory: () => getRedisCache() },
    { provide: KAFKA_PUBLISHER, useFactory: () => getKafkaPublisher() },
    {
      provide: ORDER_REPOSITORY,
      useFactory: (pool: ReturnType<typeof getPool>) =>
        new PostgresOrderRepository(pool),
      inject: [POSTGRES_POOL],
    },
  ],
  exports: [REDIS_CACHE, KAFKA_PUBLISHER, ORDER_REPOSITORY],
})
export class InfrastructureModule {}
