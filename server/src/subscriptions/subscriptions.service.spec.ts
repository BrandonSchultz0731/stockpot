import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { UsersService } from '../users/users.service';
import { SubscriptionTier } from '@shared/enums';

const WEBHOOK_AUTH_HEADER = 'Bearer test-secret-value';

const mockUsersService = {
  updateSubscriptionTier: jest.fn(),
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: UsersService, useValue: mockUsersService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              key === 'REVENUECAT_WEBHOOK_AUTH_HEADER' ? WEBHOOK_AUTH_HEADER : fallback,
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('verifyAuthorization', () => {
    it('should return true for a valid authorization header', () => {
      expect(service.verifyAuthorization(WEBHOOK_AUTH_HEADER)).toBe(true);
    });

    it('should return false for an invalid authorization header', () => {
      expect(service.verifyAuthorization('Bearer wrong-secret-value')).toBe(false);
    });

    it('should return false for undefined authorization header', () => {
      expect(service.verifyAuthorization(undefined)).toBe(false);
    });

    it('should return false when webhook auth header is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionsService,
          { provide: UsersService, useValue: mockUsersService },
          {
            provide: ConfigService,
            useValue: { get: () => '' },
          },
        ],
      }).compile();

      const svcNoSecret = module.get<SubscriptionsService>(SubscriptionsService);

      expect(svcNoSecret.verifyAuthorization('Bearer anything')).toBe(false);
    });
  });

  describe('handleWebhookEvent', () => {
    const userId = 'user-uuid-123';

    it('should set tier to Plus on INITIAL_PURCHASE with plus entitlement', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: userId,
          entitlement_ids: ['plus'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Plus,
      );
    });

    it('should set tier to Pro on INITIAL_PURCHASE with pro entitlement', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: userId,
          entitlement_ids: ['pro'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Pro,
      );
    });

    it('should prefer Pro when both entitlements are present', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: userId,
          entitlement_ids: ['plus', 'pro'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Pro,
      );
    });

    it('should update tier on RENEWAL', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'RENEWAL',
          app_user_id: userId,
          entitlement_ids: ['plus'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Plus,
      );
    });

    it('should update tier on PRODUCT_CHANGE', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'PRODUCT_CHANGE',
          app_user_id: userId,
          entitlement_ids: ['pro'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Pro,
      );
    });

    it('should update tier on UNCANCELLATION', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'UNCANCELLATION',
          app_user_id: userId,
          entitlement_ids: ['plus'],
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Plus,
      );
    });

    it('should set tier to Free on EXPIRATION', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'EXPIRATION',
          app_user_id: userId,
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Free,
      );
    });

    it('should set tier to Free on BILLING_ISSUE_DETECTED', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'BILLING_ISSUE_DETECTED',
          app_user_id: userId,
        },
      });

      expect(mockUsersService.updateSubscriptionTier).toHaveBeenCalledWith(
        userId,
        SubscriptionTier.Free,
      );
    });

    it('should not update tier on CANCELLATION', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'CANCELLATION',
          app_user_id: userId,
        },
      });

      expect(mockUsersService.updateSubscriptionTier).not.toHaveBeenCalled();
    });

    it('should ignore unknown event types gracefully', async () => {
      await service.handleWebhookEvent({
        api_version: '1.0',
        event: {
          type: 'SOME_FUTURE_EVENT',
          app_user_id: userId,
        },
      });

      expect(mockUsersService.updateSubscriptionTier).not.toHaveBeenCalled();
    });
  });

  describe('entitlementToTier', () => {
    it('should return Free for empty entitlements', () => {
      expect(service.entitlementToTier([])).toBe(SubscriptionTier.Free);
    });

    it('should return Free for undefined entitlements', () => {
      expect(service.entitlementToTier(undefined)).toBe(SubscriptionTier.Free);
    });

    it('should return Plus for plus entitlement', () => {
      expect(service.entitlementToTier(['plus'])).toBe(SubscriptionTier.Plus);
    });

    it('should return Pro for pro entitlement', () => {
      expect(service.entitlementToTier(['pro'])).toBe(SubscriptionTier.Pro);
    });

    it('should return Free for unknown entitlements', () => {
      expect(service.entitlementToTier(['unknown'])).toBe(SubscriptionTier.Free);
    });
  });
});
