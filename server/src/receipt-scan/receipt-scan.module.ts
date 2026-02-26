import { Module } from '@nestjs/common';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { ReceiptScanController } from './receipt-scan.controller';
import { ReceiptScanService } from './receipt-scan.service';

@Module({
  imports: [AnthropicModule, UsageTrackingModule],
  controllers: [ReceiptScanController],
  providers: [ReceiptScanService],
})
export class ReceiptScanModule {}
