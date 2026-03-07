import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsageTrackingService } from './usage-tracking.service';
import { UsageTracking } from './entities/usage-tracking.entity';
import { formatISODate } from '@shared/dates';
import { MessageType, SubscriptionTier } from '@shared/enums';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({}),
};

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingService,
        { provide: getRepositoryToken(UsageTracking), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsageTrackingService>(UsageTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentPeriod', () => {
    const now = new Date();
    now.setDate(1);
    const expectedPeriodStart = formatISODate(now);

    it('should return existing record when found', async () => {
      const existing = {
        id: 'ut-1',
        userId: 'u1',
        periodStart: expectedPeriodStart,
        featureCounts: { [MessageType.ReceiptScan]: 5 },
      };
      mockRepo.findOne.mockResolvedValue(existing);

      const result = await service.getCurrentPeriod('u1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'u1', periodStart: expectedPeriodStart },
      });
      expect(result).toEqual(existing);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should create new record when none exists', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created = {
        id: 'ut-new',
        userId: 'u1',
        periodStart: expectedPeriodStart,
        featureCounts: {},
      };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.getCurrentPeriod('u1');

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        periodStart: expectedPeriodStart,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('increment', () => {
    it('should increment a counter field atomically', async () => {
      const record = { id: 'ut-1', userId: 'u1' };
      mockRepo.findOne.mockResolvedValue(record);

      await service.increment('u1', 'totalInputTokens', 100);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UsageTracking);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: 'ut-1',
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should use default amount of 1', async () => {
      const record = { id: 'ut-1', userId: 'u1' };
      mockRepo.findOne.mockResolvedValue(record);

      await service.increment('u1', 'totalOutputTokens');

      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        totalOutputTokens: expect.any(Function),
      });
    });
  });

  describe('incrementFeatureCount', () => {
    it('should increment a feature count via JSONB update', async () => {
      const record = { id: 'ut-1', userId: 'u1' };
      mockRepo.findOne.mockResolvedValue(record);

      await service.incrementFeatureCount('u1', MessageType.ReceiptScan);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(UsageTracking);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        featureCounts: expect.any(Function),
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', {
        id: 'ut-1',
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('checkQuota', () => {
    it('should allow internal message types unconditionally', async () => {
      const result = await service.checkQuota(
        'u1',
        MessageType.ShelfLife,
        SubscriptionTier.Free,
      );

      expect(result).toEqual({ allowed: true, currentCount: 0, limit: null });
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('should allow Pro tier with generous limits', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'ut-1',
        userId: 'u1',
        featureCounts: { [MessageType.ReceiptScan]: 20 },
      });

      const result = await service.checkQuota(
        'u1',
        MessageType.ReceiptScan,
        SubscriptionTier.Pro,
      );

      expect(result).toEqual({ allowed: true, currentCount: 20, limit: 40 });
    });

    it('should allow when under limit', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'ut-1',
        userId: 'u1',
        featureCounts: { [MessageType.ReceiptScan]: 2 },
      });

      const result = await service.checkQuota(
        'u1',
        MessageType.ReceiptScan,
        SubscriptionTier.Free,
      );

      expect(result).toEqual({ allowed: true, currentCount: 2, limit: 3 });
    });

    it('should deny when at or over limit', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'ut-1',
        userId: 'u1',
        featureCounts: { [MessageType.ReceiptScan]: 3 },
      });

      const result = await service.checkQuota(
        'u1',
        MessageType.ReceiptScan,
        SubscriptionTier.Free,
      );

      expect(result).toEqual({ allowed: false, currentCount: 3, limit: 3 });
    });

    it('should treat missing feature count as zero', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'ut-1',
        userId: 'u1',
        featureCounts: {},
      });

      const result = await service.checkQuota(
        'u1',
        MessageType.AiChat,
        SubscriptionTier.Free,
      );

      expect(result).toEqual({ allowed: true, currentCount: 0, limit: 8 });
    });
  });
});
