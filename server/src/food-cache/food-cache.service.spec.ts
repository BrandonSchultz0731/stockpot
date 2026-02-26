import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FoodCacheService } from './food-cache.service';
import { FoodCache } from './entities/food-cache.entity';
import { AnthropicService } from '../anthropic/anthropic.service';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('TEST_API_KEY'),
};

const mockAnthropicService = {
  sendMessage: jest.fn(),
};

const mockFetchResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data),
});

describe('FoodCacheService', () => {
  let service: FoodCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodCacheService,
        { provide: getRepositoryToken(FoodCache), useValue: mockRepo },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AnthropicService, useValue: mockAnthropicService },
      ],
    }).compile();

    service = module.get<FoodCacheService>(FoodCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchLocal', () => {
    it('should query repo with ILIKE on name and usdaDescription', async () => {
      const cached = [
        {
          id: 'fc-1',
          fdcId: 123,
          name: 'Chicken Breast',
          usdaDescription: 'Chicken, broilers or fryers, breast',
          usdaDataType: 'SR Legacy',
          category: 'Protein',
          brand: null,
          barcode: null,
          nutritionPer100g: { calories: 165 },
        },
      ];
      mockRepo.find.mockResolvedValue(cached);

      const results = await service.searchLocal('chicken', 10);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: [
          { name: expect.objectContaining({ _value: '%chicken%' }), usdaDataType: expect.objectContaining({ _value: 'Foundation' }) },
          { name: expect.objectContaining({ _value: '%chicken%' }), usdaDataType: expect.objectContaining({ _value: 'SR Legacy' }) },
          { usdaDescription: expect.objectContaining({ _value: '%chicken%' }), usdaDataType: expect.objectContaining({ _value: 'Foundation' }) },
          { usdaDescription: expect.objectContaining({ _value: '%chicken%' }), usdaDataType: expect.objectContaining({ _value: 'SR Legacy' }) },
          { name: expect.objectContaining({ _value: '%chicken%' }), usdaDataType: expect.objectContaining({ _type: 'isNull' }) },
        ],
        take: 10,
        order: { name: 'ASC' },
      });
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          id: 'fc-1',
          fdcId: 123,
          name: 'Chicken Breast',
          source: 'cache',
        }),
      );
    });

    it('should return empty array when no local results', async () => {
      mockRepo.find.mockResolvedValue([]);

      const results = await service.searchLocal('nonexistent', 10);

      expect(results).toEqual([]);
    });
  });

  describe('searchUsda', () => {
    it('should call USDA API and map results', async () => {
      const usdaResponse = {
        foods: [
          {
            fdcId: 456,
            description: 'Chicken, breast, raw',
            dataType: 'SR Legacy',
            brandOwner: null,
            gtinUpc: null,
            foodNutrients: [
              { nutrientNumber: '1008', value: 165 },
              { nutrientNumber: '1003', value: 31 },
              { nutrientNumber: '1004', value: 3.6 },
              { nutrientNumber: '1005', value: 0 },
            ],
          },
        ],
        totalHits: 1,
      };

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.searchUsda('chicken', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nal.usda.gov/fdc/v1/foods/search'),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=TEST_API_KEY'),
      );
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          fdcId: 456,
          name: 'Chicken, Breast',
          usdaDescription: 'Chicken, breast, raw',
          usdaDataType: 'SR Legacy',
          source: 'usda',
          nutritionPer100g: {
            calories: 165,
            protein: 31,
            totalFat: 3.6,
            carbohydrate: 0,
          },
        }),
      );
    });

    it('should clean food name by taking first comma segment and title-casing', async () => {
      const usdaResponse = {
        foods: [
          {
            fdcId: 789,
            description: 'yogurt, greek, plain, nonfat',
            dataType: 'SR Legacy',
            foodNutrients: [],
          },
        ],
        totalHits: 1,
      };

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.searchUsda('yogurt', 10);

      expect(results[0].name).toBe('Yogurt, Greek, Plain');
    });

    it('should include brand and barcode from branded foods', async () => {
      const usdaResponse = {
        foods: [
          {
            fdcId: 999,
            description: 'GREEK YOGURT',
            dataType: 'Branded',
            brandOwner: 'Chobani',
            gtinUpc: '894700010045',
            foodNutrients: [],
          },
        ],
        totalHits: 1,
      };

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.searchUsda('yogurt', 10);

      expect(results[0].brand).toBe('Chobani');
      expect(results[0].barcode).toBe('894700010045');
    });

    it('should return empty array on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockFetchResponse({}, false, 500),
      );

      const results = await service.searchUsda('chicken', 10);

      expect(results).toEqual([]);
    });

    it('should return empty array on network failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const results = await service.searchUsda('chicken', 10);

      expect(results).toEqual([]);
    });

    it('should cap pageSize at 50', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        mockFetchResponse({ foods: [], totalHits: 0 }),
      );

      await service.searchUsda('chicken', 100);

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('pageSize=50');
    });

    it('should return null nutritionPer100g when no nutrients match', async () => {
      const usdaResponse = {
        foods: [
          {
            fdcId: 111,
            description: 'Water',
            dataType: 'SR Legacy',
            foodNutrients: [
              { nutrientNumber: '9999', value: 0 },
            ],
          },
        ],
        totalHits: 1,
      };

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.searchUsda('water', 10);

      expect(results[0].nutritionPer100g).toBeNull();
    });

    it('should return null nutritionPer100g when nutrients array is empty', async () => {
      const usdaResponse = {
        foods: [
          {
            fdcId: 112,
            description: 'Test food',
            dataType: 'SR Legacy',
            foodNutrients: [],
          },
        ],
        totalHits: 1,
      };

      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.searchUsda('test', 10);

      expect(results[0].nutritionPer100g).toBeNull();
    });
  });

  describe('search', () => {
    it('should return only local results when they fill the limit', async () => {
      const localItems = Array.from({ length: 5 }, (_, i) => ({
        id: `fc-${i}`,
        fdcId: i,
        name: `Food ${i}`,
        usdaDescription: null,
        usdaDataType: null,
        category: null,
        brand: null,
        barcode: null,
        nutritionPer100g: null,
      }));
      mockRepo.find.mockResolvedValue(localItems);

      const results = await service.search('food', 5);

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.source === 'cache')).toBe(true);
    });

    it('should supplement with USDA results when local results are insufficient', async () => {
      mockRepo.find.mockResolvedValue([
        {
          id: 'fc-1',
          fdcId: 100,
          name: 'Chicken Breast',
          usdaDescription: null,
          usdaDataType: null,
          category: null,
          brand: null,
          barcode: null,
          nutritionPer100g: null,
        },
      ]);

      const usdaResponse = {
        foods: [
          {
            fdcId: 200,
            description: 'Chicken thigh, raw',
            dataType: 'SR Legacy',
            foodNutrients: [],
          },
        ],
        totalHits: 1,
      };
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.search('chicken', 5);

      expect(results).toHaveLength(2);
      expect(results.some((r) => r.source === 'cache')).toBe(true);
      expect(results.some((r) => r.source === 'usda')).toBe(true);
    });

    it('should deduplicate USDA results that already exist in cache by fdcId', async () => {
      mockRepo.find.mockResolvedValue([
        {
          id: 'fc-1',
          fdcId: 100,
          name: 'Chicken Breast',
          usdaDescription: null,
          usdaDataType: null,
          category: null,
          brand: null,
          barcode: null,
          nutritionPer100g: null,
        },
      ]);

      const usdaResponse = {
        foods: [
          {
            fdcId: 100,
            description: 'Chicken, breast',
            dataType: 'SR Legacy',
            foodNutrients: [],
          },
          {
            fdcId: 200,
            description: 'Chicken, thigh',
            dataType: 'SR Legacy',
            foodNutrients: [],
          },
        ],
        totalHits: 2,
      };
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(usdaResponse));

      const results = await service.search('chicken', 5);

      // fdcId 100 is filtered out (already in cache), fdcId 200 is new
      expect(results).toHaveLength(2);
      const fdcIds = results.map((r) => r.fdcId);
      expect(fdcIds).toContain(100);
      expect(fdcIds).toContain(200);
    });
  });

  describe('findById', () => {
    it('should find food cache by id', async () => {
      const food = { id: 'fc-1', name: 'Chicken' };
      mockRepo.findOne.mockResolvedValue(food);

      const result = await service.findById('fc-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'fc-1' } });
      expect(result).toEqual(food);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('nope');

      expect(result).toBeNull();
    });
  });

  describe('findByFdcId', () => {
    it('should find food cache by fdcId', async () => {
      const food = { id: 'fc-1', fdcId: 123, name: 'Chicken' };
      mockRepo.findOne.mockResolvedValue(food);

      const result = await service.findByFdcId(123);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { fdcId: 123 } });
      expect(result).toEqual(food);
    });

    it('should return null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.findByFdcId(999);

      expect(result).toBeNull();
    });
  });

  describe('cacheUsdaFood', () => {
    it('should return existing entry if fdcId already cached', async () => {
      const existing = { id: 'fc-1', fdcId: 123, name: 'Chicken' };
      mockRepo.findOne.mockResolvedValue(existing);

      const result = await service.cacheUsdaFood({
        fdcId: 123,
        name: 'Chicken',
        source: 'usda',
      });

      expect(result).toEqual(existing);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should create new entry when fdcId not cached', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const created = {
        id: 'fc-new',
        fdcId: 456,
        name: 'Greek Yogurt',
        usdaDescription: 'Yogurt, Greek',
      };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.cacheUsdaFood({
        fdcId: 456,
        name: 'Greek Yogurt',
        usdaDescription: 'Yogurt, Greek',
        usdaDataType: 'SR Legacy',
        source: 'usda',
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        fdcId: 456,
        name: 'Greek Yogurt',
        usdaDescription: 'Yogurt, Greek',
        usdaDataType: 'SR Legacy',
        brand: undefined,
        barcode: undefined,
        nutritionPer100g: undefined,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should skip fdcId lookup when fdcId is not provided', async () => {
      const created = { id: 'fc-new', name: 'Custom Food' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      await service.cacheUsdaFood({
        name: 'Custom Food',
        source: 'usda',
      });

      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  describe('findByBarcode', () => {
    it('should return cached result when barcode exists locally', async () => {
      const cached = {
        id: 'fc-1',
        fdcId: 999,
        name: 'Greek Yogurt',
        usdaDescription: 'GREEK YOGURT',
        usdaDataType: 'Branded',
        category: 'Dairy',
        brand: 'Chobani',
        barcode: '894700010045',
        nutritionPer100g: { calories: 100 },
      };
      mockRepo.findOne.mockResolvedValue(cached);

      const result = await service.findByBarcode('894700010045');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { barcode: '894700010045' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'fc-1',
          barcode: '894700010045',
          source: 'cache',
        }),
      );
    });

    it('should fall back to Open Food Facts when not cached locally', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const offResponse = {
        status: 1,
        product: {
          product_name: 'Lemon Juice',
          brands: 'Sicilia',
          code: '03084984',
          quantity: '200 ml',
          nutriments: {
            'energy-kcal_100g': 40,
            proteins_100g: 0,
            fat_100g: 0,
            carbohydrates_100g: 8,
          },
        },
      };
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(offResponse));

      const result = await service.findByBarcode('03084984');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://world.openfoodfacts.org/api/v2/product/03084984'),
      );
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Lemon Juice',
          brand: 'Sicilia',
          barcode: '03084984',
          packageQuantity: 200,
          packageUnit: 'ml',
          source: 'openfoodfacts',
          nutritionPer100g: {
            calories: 40,
            protein: 0,
            totalFat: 0,
            carbohydrate: 8,
          },
        }),
      );
    });

    it('should return null when product not found in Open Food Facts', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const offResponse = {
        status: 0,
        status_verbose: 'product not found',
      };
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse(offResponse));

      const result = await service.findByBarcode('000000000000');

      expect(result).toBeNull();
    });

    it('should return null when Open Food Facts API fails', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      global.fetch = jest.fn().mockResolvedValue(
        mockFetchResponse({}, false, 500),
      );

      const result = await service.findByBarcode('894700010045');

      expect(result).toBeNull();
    });
  });

  describe('constructor', () => {
    it('should default to DEMO_KEY when FOOD_DATA_CENTRAL_API_KEY not set', async () => {
      const configWithNoKey = { get: jest.fn().mockReturnValue(undefined) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FoodCacheService,
          { provide: getRepositoryToken(FoodCache), useValue: mockRepo },
          { provide: ConfigService, useValue: configWithNoKey },
          { provide: AnthropicService, useValue: mockAnthropicService },
        ],
      }).compile();

      const svc = module.get<FoodCacheService>(FoodCacheService);

      global.fetch = jest.fn().mockResolvedValue(
        mockFetchResponse({ foods: [], totalHits: 0 }),
      );

      await svc.searchUsda('test', 5);

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('api_key=DEMO_KEY');
    });
  });
});
