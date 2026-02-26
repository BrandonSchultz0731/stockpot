import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { PantryItem } from './entities/pantry-item.entity';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

const mockPantryRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockFoodCacheService = {
  searchUsda: jest.fn(),
  cacheUsdaFood: jest.fn(),
  findByFdcId: jest.fn(),
};

const mockAnthropicService = {
  sendMessage: jest.fn(),
};

describe('PantryService', () => {
  let service: PantryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PantryService,
        { provide: getRepositoryToken(PantryItem), useValue: mockPantryRepo },
        { provide: FoodCacheService, useValue: mockFoodCacheService },
        { provide: AnthropicService, useValue: mockAnthropicService },
      ],
    }).compile();

    service = module.get<PantryService>(PantryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return all pantry items for user with food cache joined', async () => {
      const items = [
        {
          id: 'pi-1',
          userId: 'u1',
          displayName: 'Chicken Breast',
          foodCache: { name: 'Chicken Breast' },
        },
        {
          id: 'pi-2',
          userId: 'u1',
          displayName: 'Greek Yogurt',
          foodCache: { name: 'Greek Yogurt' },
        },
      ];
      mockPantryRepo.find.mockResolvedValue(items);

      const result = await service.findAllForUser('u1');

      expect(mockPantryRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        relations: ['foodCache'],
        order: { displayName: 'ASC' },
      });
      expect(result).toEqual(items);
    });

    it('should return empty array when user has no items', async () => {
      mockPantryRepo.find.mockResolvedValue([]);

      const result = await service.findAllForUser('u1');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create item with existing foodCacheId', async () => {
      const dto = {
        foodCacheId: 'fc-1',
        displayName: 'Chicken Breast',
        quantity: 2,
        unit: UnitOfMeasure.Lb,
        storageLocation: StorageLocation.Fridge,
      };
      const created = { id: 'pi-1', userId: 'u1', ...dto };
      mockPantryRepo.create.mockReturnValue(created);
      mockPantryRepo.save.mockResolvedValue(created);

      const result = await service.create('u1', dto);

      expect(mockPantryRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        foodCacheId: 'fc-1',
        displayName: 'Chicken Breast',
        quantity: 2,
        unit: UnitOfMeasure.Lb,
        storageLocation: StorageLocation.Fridge,
        expirationDate: undefined,
        expiryIsEstimated: false,
        opened: false,
        notes: undefined,
      });
      expect(result).toEqual(created);
      expect(mockFoodCacheService.searchUsda).not.toHaveBeenCalled();
    });

    it('should cache USDA food when fdcId provided and found in search', async () => {
      const dto = {
        fdcId: 456,
        displayName: 'Chicken Breast',
        quantity: 1,
        unit: UnitOfMeasure.Lb,
      };
      const usdaResult = {
        fdcId: 456,
        name: 'Chicken Breast',
        source: 'usda',
      };
      const cachedFood = { id: 'fc-new', fdcId: 456, name: 'Chicken Breast' };

      mockFoodCacheService.searchUsda.mockResolvedValue([usdaResult]);
      mockFoodCacheService.cacheUsdaFood.mockResolvedValue(cachedFood);

      const created = { id: 'pi-1', userId: 'u1', foodCacheId: 'fc-new' };
      mockPantryRepo.create.mockReturnValue(created);
      mockPantryRepo.save.mockResolvedValue(created);

      const result = await service.create('u1', dto);

      expect(mockFoodCacheService.searchUsda).toHaveBeenCalledWith(
        'Chicken Breast',
        50,
      );
      expect(mockFoodCacheService.cacheUsdaFood).toHaveBeenCalledWith(usdaResult);
      expect(mockPantryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ foodCacheId: 'fc-new' }),
      );
      expect(result).toEqual(created);
    });

    it('should use existing cache entry when fdcId not found in USDA search', async () => {
      const dto = {
        fdcId: 456,
        displayName: 'Chicken Breast',
        quantity: 1,
        unit: UnitOfMeasure.Lb,
      };

      mockFoodCacheService.searchUsda.mockResolvedValue([]);
      mockFoodCacheService.findByFdcId.mockResolvedValue({
        id: 'fc-existing',
        fdcId: 456,
      });

      const created = { id: 'pi-1', userId: 'u1', foodCacheId: 'fc-existing' };
      mockPantryRepo.create.mockReturnValue(created);
      mockPantryRepo.save.mockResolvedValue(created);

      await service.create('u1', dto);

      expect(mockFoodCacheService.findByFdcId).toHaveBeenCalledWith(456);
      expect(mockPantryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ foodCacheId: 'fc-existing' }),
      );
    });

    it('should create minimal cache entry when fdcId not found anywhere', async () => {
      const dto = {
        fdcId: 789,
        displayName: 'Mystery Food',
        quantity: 1,
        unit: UnitOfMeasure.Count,
      };

      mockFoodCacheService.searchUsda.mockResolvedValue([]);
      mockFoodCacheService.findByFdcId.mockResolvedValue(null);
      mockFoodCacheService.cacheUsdaFood.mockResolvedValue({
        id: 'fc-minimal',
        fdcId: 789,
        name: 'Mystery Food',
      });

      const created = { id: 'pi-1', userId: 'u1', foodCacheId: 'fc-minimal' };
      mockPantryRepo.create.mockReturnValue(created);
      mockPantryRepo.save.mockResolvedValue(created);

      await service.create('u1', dto);

      expect(mockFoodCacheService.cacheUsdaFood).toHaveBeenCalledWith({
        fdcId: 789,
        name: 'Mystery Food',
        source: 'usda',
      });
      expect(mockPantryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ foodCacheId: 'fc-minimal' }),
      );
    });

    it('should apply default values for expiryIsEstimated and opened', async () => {
      const dto = {
        foodCacheId: 'fc-1',
        displayName: 'Milk',
        quantity: 1,
        unit: UnitOfMeasure.Gallon,
      };
      mockPantryRepo.create.mockReturnValue({});
      mockPantryRepo.save.mockResolvedValue({});

      await service.create('u1', dto);

      // No expiration date provided and estimation returns nothing → expiryIsEstimated defaults to false
      expect(mockPantryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiryIsEstimated: false,
          opened: false,
        }),
      );
    });

    it('should respect explicit expiryIsEstimated and opened values', async () => {
      const dto = {
        foodCacheId: 'fc-1',
        displayName: 'Milk',
        quantity: 1,
        unit: UnitOfMeasure.Gallon,
        expiryIsEstimated: false,
        opened: true,
      };
      mockPantryRepo.create.mockReturnValue({});
      mockPantryRepo.save.mockResolvedValue({});

      await service.create('u1', dto);

      expect(mockPantryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiryIsEstimated: false,
          opened: true,
        }),
      );
    });
  });

  describe('createBulk', () => {
    it('should create multiple items sequentially', async () => {
      const items = [
        { foodCacheId: 'fc-1', displayName: 'Milk', quantity: 1, unit: UnitOfMeasure.Gallon },
        { foodCacheId: 'fc-2', displayName: 'Eggs', quantity: 12, unit: UnitOfMeasure.Count },
      ];

      mockPantryRepo.create.mockImplementation((data) => ({ id: `pi-${data.displayName}`, ...data }));
      mockPantryRepo.save.mockImplementation((item) => Promise.resolve(item));

      const results = await service.createBulk('u1', items);

      expect(results).toHaveLength(2);
      expect(mockPantryRepo.create).toHaveBeenCalledTimes(2);
      expect(mockPantryRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update pantry item owned by user', async () => {
      const existing = {
        id: 'pi-1',
        userId: 'u1',
        displayName: 'Chicken',
        quantity: 2,
        unit: UnitOfMeasure.Lb,
        storageLocation: StorageLocation.Fridge,
      };
      mockPantryRepo.findOne.mockResolvedValue({ ...existing });

      const updated = {
        ...existing,
        quantity: 1,
        storageLocation: StorageLocation.Freezer,
      };
      mockPantryRepo.save.mockResolvedValue(updated);

      const result = await service.update('u1', 'pi-1', {
        quantity: 1,
        storageLocation: StorageLocation.Freezer,
      });

      expect(mockPantryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pi-1', userId: 'u1' },
      });
      expect(mockPantryRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPantryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('u1', 'pi-nonexistent', { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item belongs to different user', async () => {
      mockPantryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('u2', 'pi-1', { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove pantry item owned by user', async () => {
      const item = { id: 'pi-1', userId: 'u1', displayName: 'Chicken' };
      mockPantryRepo.findOne.mockResolvedValue(item);
      mockPantryRepo.remove.mockResolvedValue(item);

      await service.remove('u1', 'pi-1');

      expect(mockPantryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pi-1', userId: 'u1' },
      });
      expect(mockPantryRepo.remove).toHaveBeenCalledWith(item);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPantryRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('u1', 'pi-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when item belongs to different user', async () => {
      mockPantryRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('u2', 'pi-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
