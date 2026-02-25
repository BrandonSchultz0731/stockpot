import { Module } from '@nestjs/common';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { ReceiptScanController } from './receipt-scan.controller';
import { ReceiptScanService } from './receipt-scan.service';

@Module({
  imports: [UsageTrackingModule],
  controllers: [ReceiptScanController],
  providers: [ReceiptScanService],
})
export class ReceiptScanModule {}
