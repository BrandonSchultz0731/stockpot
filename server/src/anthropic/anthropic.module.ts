import { Module } from '@nestjs/common';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { UsersModule } from '../users/users.module';
import { AnthropicService } from './anthropic.service';

@Module({
  imports: [UsageTrackingModule, UsersModule],
  providers: [AnthropicService],
  exports: [AnthropicService],
})
export class AnthropicModule {}
