import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [OrderModule],
  controllers: [HealthController],
})
export class AppModule {}
