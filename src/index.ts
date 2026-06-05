import 'dotenv/config';
import { createApp } from './infrastructure/app';
import { config } from './config';
import { getRedisCache } from './infrastructure/persistence/redis/RedisCache';
import { getKafkaPublisher } from './infrastructure/messaging/kafka/producers/KafkaEventPublisher';
import { OrderEventsConsumer } from './infrastructure/messaging/kafka/consumers/OrderEventsConsumer';
import { runMigrations } from './infrastructure/persistence/postgres/migrations/migrate';
import { logger } from './infrastructure/http/middlewares/Logger';

async function bootstrap(): Promise<void> {
  logger.info('Starting application...', { env: config.app.env });

  // Run DB migrations
  await runMigrations();
  logger.info('Migrations complete');

  // Connect Redis
  await getRedisCache().connect();
  logger.info('Redis connected');

  // Connect Kafka producer
  await getKafkaPublisher().connect();
  logger.info('Kafka producer connected');

  // Start Kafka consumer
  const consumer = new OrderEventsConsumer();
  await consumer.connect();
  await consumer.start();
  logger.info('Kafka consumer started');

  // Start HTTP server
  const app = createApp();
  const server = app.listen(config.app.port, () => {
    logger.info(`Server running on port ${config.app.port}`, {
      env: config.app.env,
      apiVersion: config.app.apiVersion,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await getKafkaPublisher().disconnect();
      await consumer.disconnect();
      await getRedisCache().disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
