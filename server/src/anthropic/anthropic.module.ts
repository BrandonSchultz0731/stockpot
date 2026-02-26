import { Module } from '@nestjs/common';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { AnthropicService } from './anthropic.service';

@Module({
  imports: [UsageTrackingModule],
  providers: [AnthropicService],
  exports: [AnthropicService],
})
export class AnthropicModule {}
