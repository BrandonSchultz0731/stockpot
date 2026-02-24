import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UsageTrackingService } from './usage-tracking.service';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageTrackingController {
  constructor(private readonly usageTrackingService: UsageTrackingService) {}

  @Get('current')
  getCurrentUsage(@GetUser('id') userId: string) {
    return this.usageTrackingService.getCurrentPeriod(userId);
  }
}
