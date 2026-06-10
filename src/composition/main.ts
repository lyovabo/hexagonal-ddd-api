import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppExceptionFilter } from '../infrastructure/http/nest/filters/app-exception.filter';
import { config } from '../config';
import { getRedisCache } from '../infrastructure/persistence/redis/RedisCache';
import { getKafkaPublisher } from '../infrastructure/messaging/kafka/producers/KafkaEventPublisher';
import { OrderEventsConsumer } from '../infrastructure/messaging/kafka/consumers/OrderEventsConsumer';
import { runMigrations } from '../infrastructure/persistence/postgres/migrations/migrate';
import { logger } from '../infrastructure/http/middlewares/Logger';

async function bootstrap(): Promise<void> {
  logger.info('Starting application (NestJS)...', { env: config.app.env });

  await runMigrations();
  logger.info('Migrations complete');

  await getRedisCache().connect();
  logger.info('Redis connected');

  await getKafkaPublisher().connect();
  logger.info('Kafka producer connected');

  const consumer = new OrderEventsConsumer();
  await consumer.connect();
  await consumer.start();
  logger.info('Kafka consumer started');

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AppExceptionFilter());
  app.setGlobalPrefix(`api/${config.app.apiVersion}`, {
    exclude: ['health/live', 'health/ready'],
  });

  await app.listen(config.app.port);
  logger.info(`NestJS server running on port ${config.app.port}`, {
    env: config.app.env,
    apiVersion: config.app.apiVersion,
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    await app.close();
    await getKafkaPublisher().disconnect();
    await consumer.disconnect();
    await getRedisCache().disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
