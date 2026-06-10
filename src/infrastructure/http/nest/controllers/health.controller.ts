import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { checkPostgresHealth } from '../../../persistence/postgres/pool';
import { getRedisCache } from '../../../persistence/redis/RedisCache';
import { getKafkaPublisher } from '../../../messaging/kafka/producers/KafkaEventPublisher';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready(@Res() res: Response) {
    const [postgres, redis, kafka] = await Promise.all([
      checkPostgresHealth(),
      getRedisCache().checkHealth(),
      getKafkaPublisher().checkHealth(),
    ]);

    const healthy = postgres && redis && kafka;
    res.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: healthy ? 'ok' : 'degraded',
      checks: { postgres, redis, kafka },
      timestamp: new Date().toISOString(),
    });
  }
}
