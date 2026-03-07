import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UsageTrackingService } from './usage-tracking.service';
import { UsersService } from '../users/users.service';
import { SubscriptionTier } from '@shared/enums';
import { MONTHLY_QUOTA_LIMITS } from '../common/config/quota-limits';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageTrackingController {
  constructor(
    private readonly usageTrackingService: UsageTrackingService,
    private readonly usersService: UsersService,
  ) {}

  @Get('current')
  async getCurrentUsage(@GetUser('id') userId: string) {
    const [usage, user] = await Promise.all([
      this.usageTrackingService.getCurrentPeriod(userId),
      this.usersService.findById(userId),
    ]);

    const tier = user?.subscriptionTier ?? SubscriptionTier.Free;
    const limits = MONTHLY_QUOTA_LIMITS[tier] ?? null;

    return { ...usage, limits };
  }
}
