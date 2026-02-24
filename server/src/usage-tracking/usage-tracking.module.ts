import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageTracking } from './entities/usage-tracking.entity';
import { UsageTrackingController } from './usage-tracking.controller';
import { UsageTrackingService } from './usage-tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsageTracking])],
  controllers: [UsageTrackingController],
  providers: [UsageTrackingService],
  exports: [UsageTrackingService],
})
export class UsageTrackingModule {}
