import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ReceiptScanService } from './receipt-scan.service';
import { ScanReceiptDto } from './dto/scan-receipt.dto';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
@Throttle({ ai: { ttl: 60_000, limit: 10 } })
export class ReceiptScanController {
  constructor(private readonly receiptScanService: ReceiptScanService) { }

  @Post('scan')
  scanReceipt(
    @GetUser('id') userId: string,
    @Body() dto: ScanReceiptDto,
  ) {
    return this.receiptScanService.scanReceipt(userId, dto);
  }
}
