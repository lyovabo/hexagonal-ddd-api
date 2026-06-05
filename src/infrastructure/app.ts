import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from '../config';

// Infrastructure
import { getPool } from './persistence/postgres/pool';
import { getRedisCache } from './persistence/redis/RedisCache';
import { getKafkaPublisher } from './messaging/kafka/producers/KafkaEventPublisher';

// Repositories
import { PostgresOrderRepository } from './persistence/postgres/repositories/PostgresOrderRepository';

// Use cases
import { CreateOrderUseCase } from '../application/use-cases/CreateOrderUseCase';
import { GetOrderUseCase } from '../application/use-cases/GetOrderUseCase';
import { UpdateOrderStatusUseCase } from '../application/use-cases/UpdateOrderStatusUseCase';

// Controllers
import { OrderController } from './http/controllers/OrderController';

// Routes
import { createOrderRouter } from './http/routes/orderRoutes';
import { createHealthRouter } from './http/routes/healthRoutes';

// Middlewares
import { errorHandler, notFoundHandler } from './http/middlewares/errorHandler';
import { Logger } from './http/middlewares/Logger';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Request logging
  app.use((req, _res, next) => {
    new Logger('http').info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // --- Dependency Injection (manual, no framework) ---
  const pool = getPool();
  const cache = getRedisCache();
  const eventPublisher = getKafkaPublisher();
  const appLogger = new Logger('use-case');

  const orderRepository = new PostgresOrderRepository(pool);

  const createOrderUseCase = new CreateOrderUseCase(orderRepository, eventPublisher, cache, appLogger);
  const getOrderUseCase = new GetOrderUseCase(orderRepository, cache, appLogger);
  const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository, eventPublisher, cache, appLogger);

  const orderController = new OrderController(createOrderUseCase, getOrderUseCase, updateOrderStatusUseCase);

  // Routes
  const apiPrefix = `/api/${config.app.apiVersion}`;
  app.use('/health', createHealthRouter());
  app.use(`${apiPrefix}/orders`, createOrderRouter(orderController));

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
