import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@SkipThrottle()
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization: string,
  ) {
    if (!this.subscriptionsService.verifyAuthorization(authorization)) {
      throw new UnauthorizedException('Invalid webhook authorization');
    }

    await this.subscriptionsService.handleWebhookEvent(body as never);

    return { ok: true };
  }
}
