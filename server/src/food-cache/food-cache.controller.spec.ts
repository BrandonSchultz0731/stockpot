import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FoodCacheController } from './food-cache.controller';
import { FoodCacheService } from './food-cache.service';

const mockFoodCacheService = {
  search: jest.fn(),
  findByBarcode: jest.fn(),
};

describe('FoodCacheController', () => {
  let controller: FoodCacheController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodCacheController],
      providers: [
        { provide: FoodCacheService, useValue: mockFoodCacheService },
      ],
    }).compile();

    controller = module.get<FoodCacheController>(FoodCacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should delegate to FoodCacheService.search with query and default limit', async () => {
      const results = [{ name: 'Chicken', source: 'cache' }];
      mockFoodCacheService.search.mockResolvedValue(results);

      const result = await controller.search('chicken');

      expect(mockFoodCacheService.search).toHaveBeenCalledWith('chicken', 20);
      expect(result).toEqual(results);
    });

    it('should parse limit from string query param', async () => {
      mockFoodCacheService.search.mockResolvedValue([]);

      await controller.search('yogurt', '10');

      expect(mockFoodCacheService.search).toHaveBeenCalledWith('yogurt', 10);
    });

    it('should default to empty string when query is undefined', async () => {
      mockFoodCacheService.search.mockResolvedValue([]);

      await controller.search(undefined);

      expect(mockFoodCacheService.search).toHaveBeenCalledWith('', 20);
    });
  });

  describe('findByBarcode', () => {
    it('should return food when barcode is found', async () => {
      const food = { name: 'Greek Yogurt', barcode: '894700010045', source: 'cache' };
      mockFoodCacheService.findByBarcode.mockResolvedValue(food);

      const result = await controller.findByBarcode('894700010045');

      expect(mockFoodCacheService.findByBarcode).toHaveBeenCalledWith('894700010045');
      expect(result).toEqual(food);
    });

    it('should throw NotFoundException when barcode is not found', async () => {
      mockFoodCacheService.findByBarcode.mockResolvedValue(null);

      await expect(controller.findByBarcode('000000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
