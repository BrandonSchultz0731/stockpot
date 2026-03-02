import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { FoodCacheService } from './food-cache.service';
import { FoodCache } from './entities/food-cache.entity';
import { AnthropicService } from '../anthropic/anthropic.service';
import { MessageType } from '@shared/enums';

const createMockQueryBuilder = (results: any[] = []) => {
  const qb: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
    getOne: jest.fn().mockResolvedValue(results[0] ?? null),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  return qb;
};

let mockQueryBuilder = createMockQueryBuilder();

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockImplementation(() => mockQueryBuilder),
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
    mockQueryBuilder = createMockQueryBuilder();
    mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

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
    it('should query repo with ILIKE via query builder and return mapped results', async () => {
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
      mockQueryBuilder = createMockQueryBuilder(cached);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const results = await service.searchLocal('chicken', 10);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('fc');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('fc.name ILIKE :q'),
        { q: '%chicken%' },
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
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

    it('should include alias search in query builder WHERE clause', async () => {
      mockQueryBuilder = createMockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      await service.searchLocal('broccoli florets', 5);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('fc.aliases::text ILIKE :q'),
        expect.any(Object),
      );
    });

    it('should return empty array when no local results', async () => {
      mockQueryBuilder = createMockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

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
      mockQueryBuilder = createMockQueryBuilder(localItems);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const results = await service.search('food', 5);

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.source === 'cache')).toBe(true);
    });

    it('should supplement with USDA results when local results are insufficient', async () => {
      mockQueryBuilder = createMockQueryBuilder([
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
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

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
      mockQueryBuilder = createMockQueryBuilder([
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
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

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

  describe('addAlias', () => {
    it('should append alias to existing entry', async () => {
      const entry = {
        id: 'fc-1',
        name: 'Broccoli',
        aliases: null,
      };
      mockRepo.findOne.mockResolvedValue(entry);
      mockRepo.save.mockResolvedValue({ ...entry, aliases: ['Broccoli Florets'] });

      await service.addAlias('fc-1', 'Broccoli Florets');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aliases: ['Broccoli Florets'],
        }),
      );
    });

    it('should not add alias if it matches the entry name', async () => {
      const entry = {
        id: 'fc-1',
        name: 'Broccoli',
        aliases: null,
      };
      mockRepo.findOne.mockResolvedValue(entry);

      await service.addAlias('fc-1', 'broccoli');

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should not add duplicate alias', async () => {
      const entry = {
        id: 'fc-1',
        name: 'Broccoli',
        aliases: ['Broccoli Florets'],
      };
      mockRepo.findOne.mockResolvedValue(entry);

      await service.addAlias('fc-1', 'broccoli florets');

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should do nothing if entry not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await service.addAlias('fc-missing', 'Something');

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should append to existing aliases array', async () => {
      const entry = {
        id: 'fc-1',
        name: 'Sesame Oil',
        aliases: ['Toasted Sesame Oil'],
      };
      mockRepo.findOne.mockResolvedValue(entry);
      mockRepo.save.mockResolvedValue({
        ...entry,
        aliases: ['Toasted Sesame Oil', 'Sesame Oil Unrefined'],
      });

      await service.addAlias('fc-1', 'Sesame Oil Unrefined');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aliases: ['Toasted Sesame Oil', 'Sesame Oil Unrefined'],
        }),
      );
    });
  });

  describe('findByAlias', () => {
    it('should find entry by alias using query builder', async () => {
      const entry = { id: 'fc-1', name: 'Broccoli', aliases: ['Broccoli Florets'] };
      mockQueryBuilder = createMockQueryBuilder([entry]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const result = await service.findByAlias('Broccoli Florets');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('jsonb_array_elements_text'),
        { name: 'Broccoli Florets' },
      );
      expect(result).toEqual(entry);
    });

    it('should return null when no alias match found', async () => {
      mockQueryBuilder = createMockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const result = await service.findByAlias('Dragon Fruit');

      expect(result).toBeNull();
    });
  });

  describe('findBestMatch', () => {
    it('should return exact match immediately', async () => {
      const food = { id: 'fc-1', name: 'Broccoli' } as FoodCache;
      mockRepo.findOne.mockResolvedValue(food);

      const result = await service.findBestMatch('Broccoli', 'user-1');

      expect(result).toEqual(food);
      expect(mockAnthropicService.sendMessage).not.toHaveBeenCalled();
    });

    it('should return alias match when no exact match', async () => {
      // findOne returns null (no exact match)
      mockRepo.findOne.mockResolvedValue(null);

      // findByAlias returns a match
      const aliasEntry = { id: 'fc-1', name: 'Broccoli', aliases: ['Broccoli Florets'] };
      mockQueryBuilder = createMockQueryBuilder([aliasEntry]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const result = await service.findBestMatch('Broccoli Florets', 'user-1');

      expect(result).toEqual(aliasEntry);
      expect(mockAnthropicService.sendMessage).not.toHaveBeenCalled();
    });

    it('should call AI when no exact or alias match and return matched entry', async () => {
      // No exact match
      mockRepo.findOne
        .mockResolvedValueOnce(null) // exact match check
        .mockResolvedValueOnce({ id: 'fc-1', name: 'Broccoli' }); // findById after AI match

      // No alias match, but searchLocal returns candidates
      const noAliasQb = createMockQueryBuilder([]);
      const searchQb = createMockQueryBuilder([
        {
          id: 'fc-1',
          name: 'Broccoli',
          fdcId: null,
          usdaDescription: null,
          usdaDataType: null,
          category: null,
          brand: null,
          barcode: null,
          nutritionPer100g: null,
        },
      ]);

      let qbCallCount = 0;
      mockRepo.createQueryBuilder.mockImplementation(() => {
        qbCallCount++;
        // First call: findByAlias, second call: searchLocal
        return qbCallCount === 1 ? noAliasQb : searchQb;
      });

      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: '{ "Broccoli Florets": "fc-1" }' }],
      });

      const result = await service.findBestMatch('Broccoli Florets', 'user-1');

      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          messageType: MessageType.FoodMatch,
        }),
      );
      expect(result).toEqual({ id: 'fc-1', name: 'Broccoli' });
    });

    it('should return null when AI finds no match', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const noAliasQb = createMockQueryBuilder([]);
      const searchQb = createMockQueryBuilder([
        {
          id: 'fc-1',
          name: 'Onion',
          fdcId: null,
          usdaDescription: null,
          usdaDataType: null,
          category: null,
          brand: null,
          barcode: null,
          nutritionPer100g: null,
        },
      ]);

      let qbCallCount = 0;
      mockRepo.createQueryBuilder.mockImplementation(() => {
        qbCallCount++;
        return qbCallCount === 1 ? noAliasQb : searchQb;
      });

      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: '{ "Red Onion": null }' }],
      });

      const result = await service.findBestMatch('Red Onion', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when no candidates exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      // Both findByAlias and searchLocal return empty
      mockQueryBuilder = createMockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockImplementation(() => mockQueryBuilder);

      const result = await service.findBestMatch('Exotic Fruit', 'user-1');

      expect(result).toBeNull();
      expect(mockAnthropicService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('findBestMatches', () => {
    it('should return empty map for empty input', async () => {
      const result = await service.findBestMatches([], 'user-1');

      expect(result.size).toBe(0);
    });

    it('should resolve exact matches without AI call', async () => {
      const food = { id: 'fc-1', name: 'Broccoli' } as FoodCache;
      mockRepo.findOne.mockResolvedValue(food);

      const result = await service.findBestMatches(['Broccoli'], 'user-1');

      expect(result.get('Broccoli')).toEqual(food);
      expect(mockAnthropicService.sendMessage).not.toHaveBeenCalled();
    });

    it('should batch unresolved names into a single AI call', async () => {
      // No exact matches
      mockRepo.findOne
        .mockResolvedValueOnce(null) // exact for "Broccoli Florets"
        .mockResolvedValueOnce(null) // exact for "Sesame Oil Unrefined"
        .mockResolvedValueOnce({ id: 'fc-1', name: 'Broccoli' }) // findById for AI result
        .mockResolvedValueOnce({ id: 'fc-2', name: 'Sesame Oil' }); // findById for AI result

      // No alias matches, but searchLocal returns candidates
      const noAliasQb = createMockQueryBuilder([]);
      const broccoliQb = createMockQueryBuilder([
        { id: 'fc-1', name: 'Broccoli', fdcId: null, usdaDescription: null, usdaDataType: null, category: null, brand: null, barcode: null, nutritionPer100g: null },
      ]);
      const sesameQb = createMockQueryBuilder([
        { id: 'fc-2', name: 'Sesame Oil', fdcId: null, usdaDescription: null, usdaDataType: null, category: null, brand: null, barcode: null, nutritionPer100g: null },
      ]);

      let qbCallCount = 0;
      mockRepo.createQueryBuilder.mockImplementation(() => {
        qbCallCount++;
        // Calls: 1=alias check broccoli, 2=searchLocal broccoli, 3=alias check sesame, 4=searchLocal sesame
        if (qbCallCount === 1 || qbCallCount === 3) return noAliasQb;
        if (qbCallCount === 2) return broccoliQb;
        return sesameQb;
      });

      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: '{ "Broccoli Florets": "fc-1", "Sesame Oil Unrefined": "fc-2" }' }],
      });

      const result = await service.findBestMatches(
        ['Broccoli Florets', 'Sesame Oil Unrefined'],
        'user-1',
      );

      // Only one AI call for both items
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledTimes(1);
      expect(result.get('Broccoli Florets')).toEqual({ id: 'fc-1', name: 'Broccoli' });
      expect(result.get('Sesame Oil Unrefined')).toEqual({ id: 'fc-2', name: 'Sesame Oil' });
    });

    it('should return null for items AI cannot match', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const noAliasQb = createMockQueryBuilder([]);
      const candidateQb = createMockQueryBuilder([
        { id: 'fc-1', name: 'Onion', fdcId: null, usdaDescription: null, usdaDataType: null, category: null, brand: null, barcode: null, nutritionPer100g: null },
      ]);

      let qbCallCount = 0;
      mockRepo.createQueryBuilder.mockImplementation(() => {
        qbCallCount++;
        return qbCallCount === 1 ? noAliasQb : candidateQb;
      });

      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: '{ "Red Onion": null }' }],
      });

      const result = await service.findBestMatches(['Red Onion'], 'user-1');

      expect(result.get('Red Onion')).toBeNull();
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
