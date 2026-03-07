import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { SubscriptionTier } from '@shared/enums';

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  entitlement_ids?: string[];
}

interface RevenueCatWebhookBody {
  api_version: string;
  event: RevenueCatEvent;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly webhookAuthHeader: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.webhookAuthHeader = this.configService.get<string>('REVENUECAT_WEBHOOK_AUTH_HEADER', '');
  }

  verifyAuthorization(authHeader: string | undefined): boolean {
    if (!this.webhookAuthHeader) {
      this.logger.warn('REVENUECAT_WEBHOOK_AUTH_HEADER not configured');
      return false;
    }

    if (!authHeader) {
      return false;
    }

    const expectedBuf = Buffer.from(this.webhookAuthHeader);
    const receivedBuf = Buffer.from(authHeader);

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  async handleWebhookEvent(body: RevenueCatWebhookBody): Promise<void> {
    const { event } = body;
    const userId = event.app_user_id;

    // Events that grant/restore a subscription
    const grantEvents = [
      'INITIAL_PURCHASE',
      'RENEWAL',
      'PRODUCT_CHANGE',
      'UNCANCELLATION',
    ];

    // Events that revoke a subscription
    const revokeEvents = ['EXPIRATION', 'BILLING_ISSUE_DETECTED'];

    if (grantEvents.includes(event.type)) {
      const tier = this.entitlementToTier(event.entitlement_ids);
      this.logger.log(`Granting ${tier} to user ${userId} (${event.type})`);
      await this.usersService.updateSubscriptionTier(userId, tier);
    } else if (revokeEvents.includes(event.type)) {
      this.logger.log(`Revoking subscription for user ${userId} (${event.type})`);
      await this.usersService.updateSubscriptionTier(userId, SubscriptionTier.Free);
    } else {
      this.logger.log(`Ignoring event type: ${event.type} for user ${userId}`);
    }
  }

  entitlementToTier(entitlementIds?: string[]): SubscriptionTier {
    if (!entitlementIds || entitlementIds.length === 0) {
      return SubscriptionTier.Free;
    }
    if (entitlementIds.includes('pro')) {
      return SubscriptionTier.Pro;
    }
    if (entitlementIds.includes('plus')) {
      return SubscriptionTier.Plus;
    }
    return SubscriptionTier.Free;
  }
}
