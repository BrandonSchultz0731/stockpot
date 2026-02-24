import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsageTrackingService } from './usage-tracking.service';
import { UsageTracking } from './entities/usage-tracking.entity';

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
    const expectedPeriodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    it('should return existing record when found', async () => {
      const existing = {
        id: 'ut-1',
        userId: 'u1',
        periodStart: expectedPeriodStart,
        receiptScans: 5,
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
        receiptScans: 0,
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

      await service.increment('u1', 'receiptScans', 1);

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

      await service.increment('u1', 'aiChatMessages');

      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        aiChatMessages: expect.any(Function),
      });
    });
  });
});
