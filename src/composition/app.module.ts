import { Module } from '@nestjs/common';
import { OrderModule } from './order.module';
import { HealthController } from '../infrastructure/http/nest/controllers/health.controller';

@Module({
  imports: [OrderModule],
  controllers: [HealthController],
})
export class AppModule {}
