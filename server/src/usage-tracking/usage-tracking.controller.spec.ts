import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackingController } from './usage-tracking.controller';
import { UsageTrackingService } from './usage-tracking.service';
import { UsersService } from '../users/users.service';
import { MessageType, SubscriptionTier } from '@shared/enums';
import { MONTHLY_QUOTA_LIMITS } from '../common/config/quota-limits';

const mockService = {
  getCurrentPeriod: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
};

describe('UsageTrackingController', () => {
  let controller: UsageTrackingController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageTrackingController],
      providers: [
        { provide: UsageTrackingService, useValue: mockService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsageTrackingController>(UsageTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUsage', () => {
    it('should return usage with limits for free tier', async () => {
      const usage = {
        id: 'ut-1',
        userId: 'u1',
        periodStart: '2026-02-01',
        featureCounts: {
          [MessageType.ReceiptScan]: 3,
          [MessageType.MealPlan]: 1,
          [MessageType.RecipeGeneration]: 5,
          [MessageType.AiChat]: 10,
        },
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostCents: 0,
      };
      mockService.getCurrentPeriod.mockResolvedValue(usage);
      mockUsersService.findById.mockResolvedValue({
        id: 'u1',
        subscriptionTier: SubscriptionTier.Free,
      });

      const result = await controller.getCurrentUsage('u1');

      expect(mockService.getCurrentPeriod).toHaveBeenCalledWith('u1');
      expect(mockUsersService.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual({
        ...usage,
        limits: MONTHLY_QUOTA_LIMITS[SubscriptionTier.Free],
      });
    });

    it('should return pro tier limits', async () => {
      const usage = {
        id: 'ut-2',
        userId: 'u2',
        periodStart: '2026-02-01',
        featureCounts: {},
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostCents: 0,
      };
      mockService.getCurrentPeriod.mockResolvedValue(usage);
      mockUsersService.findById.mockResolvedValue({
        id: 'u2',
        subscriptionTier: SubscriptionTier.Pro,
      });

      const result = await controller.getCurrentUsage('u2');

      expect(result.limits).toEqual(
        MONTHLY_QUOTA_LIMITS[SubscriptionTier.Pro],
      );
    });

    it('should default to free tier when user not found', async () => {
      const usage = {
        id: 'ut-3',
        userId: 'u3',
        periodStart: '2026-02-01',
        featureCounts: {},
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostCents: 0,
      };
      mockService.getCurrentPeriod.mockResolvedValue(usage);
      mockUsersService.findById.mockResolvedValue(null);

      const result = await controller.getCurrentUsage('u3');

      expect(result.limits).toEqual(
        MONTHLY_QUOTA_LIMITS[SubscriptionTier.Free],
      );
    });
  });
});
