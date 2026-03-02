import { Module } from '@nestjs/common';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { ReceiptScanController } from './receipt-scan.controller';
import { ReceiptScanService } from './receipt-scan.service';

@Module({
  imports: [AnthropicModule],
  controllers: [ReceiptScanController],
  providers: [ReceiptScanService],
})
export class ReceiptScanModule {}
