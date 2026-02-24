import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackingController } from './usage-tracking.controller';
import { UsageTrackingService } from './usage-tracking.service';

const mockService = {
  getCurrentPeriod: jest.fn(),
};

describe('UsageTrackingController', () => {
  let controller: UsageTrackingController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageTrackingController],
      providers: [
        { provide: UsageTrackingService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<UsageTrackingController>(UsageTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentUsage', () => {
    it('should delegate to UsageTrackingService.getCurrentPeriod with userId', async () => {
      const usage = {
        id: 'ut-1',
        userId: 'u1',
        periodStart: '2026-02-01',
        receiptScans: 3,
        mealPlansGenerated: 1,
        recipesGenerated: 5,
        aiChatMessages: 10,
        substitutionRequests: 2,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        estimatedCostCents: 0,
      };
      mockService.getCurrentPeriod.mockResolvedValue(usage);

      const result = await controller.getCurrentUsage('u1');

      expect(mockService.getCurrentPeriod).toHaveBeenCalledWith('u1');
      expect(result).toEqual(usage);
    });
  });
});
