import { Router, Request, Response } from 'express';
import { checkPostgresHealth } from '../../persistence/postgres/pool';
import { getRedisCache } from '../../persistence/redis/RedisCache';
import { getKafkaPublisher } from '../../messaging/kafka/producers/KafkaEventPublisher';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/ready', async (_req: Request, res: Response) => {
    const [postgres, redis, kafka] = await Promise.all([
      checkPostgresHealth(),
      getRedisCache().checkHealth(),
      getKafkaPublisher().checkHealth(),
    ]);

    const healthy = postgres && redis && kafka;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      checks: { postgres, redis, kafka },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
