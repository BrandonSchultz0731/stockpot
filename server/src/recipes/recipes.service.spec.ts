import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { Recipe } from './entities/recipe.entity';
import { SavedRecipe } from './entities/saved-recipe.entity';
import { PantryService } from '../pantry/pantry.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { PantryStatus } from '@shared/enums';

const mockRecipeRepo = {
  findOne: jest.fn(),
};

const mockSavedRecipeRepo = {};

const mockPantryService = {
  findAllForUser: jest.fn(),
};

const mockAnthropicService = {};
const mockFoodCacheService = {};

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: getRepositoryToken(Recipe), useValue: mockRecipeRepo },
        { provide: getRepositoryToken(SavedRecipe), useValue: mockSavedRecipeRepo },
        { provide: PantryService, useValue: mockPantryService },
        { provide: AnthropicService, useValue: mockAnthropicService },
        { provide: FoodCacheService, useValue: mockFoodCacheService },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  describe('checkPantryStatus', () => {
    const baseRecipe = {
      id: 'recipe-1',
      ingredients: [
        { name: 'Flour', quantity: 2, unit: 'cup', baseQuantity: 250, baseUnit: 'g', foodCacheId: 'flour-id' },
        { name: 'Sugar', quantity: 1, unit: 'cup', baseQuantity: 200, baseUnit: 'g', foodCacheId: 'sugar-id' },
      ],
    };

    it('throws NotFoundException when recipe does not exist', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.checkPantryStatus('missing', 'user-1', 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns statuses for each ingredient by index', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(baseRecipe);
      mockPantryService.findAllForUser.mockResolvedValue([
        { foodCacheId: 'flour-id', quantity: 1000, unit: 'g' },
        { foodCacheId: 'sugar-id', quantity: 500, unit: 'g' },
      ]);

      const result = await service.checkPantryStatus('recipe-1', 'user-1', 1);

      expect(result).toHaveProperty('0');
      expect(result).toHaveProperty('1');
      expect(result['0']).toBe(PantryStatus.Enough);
      expect(result['1']).toBe(PantryStatus.Enough);
    });

    it('scales ingredient quantities before checking pantry', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(baseRecipe);
      // Pantry has 500g of flour — enough for scale=1 (250g) but not scale=3 (750g)
      mockPantryService.findAllForUser.mockResolvedValue([
        { foodCacheId: 'flour-id', quantity: 500, unit: 'g' },
        { foodCacheId: 'sugar-id', quantity: 1000, unit: 'g' },
      ]);

      const result = await service.checkPantryStatus('recipe-1', 'user-1', 3);

      // Flour: needs 750g, have 500g → low
      expect(result['0']).toBe(PantryStatus.Low);
      // Sugar: needs 600g, have 1000g → enough
      expect(result['1']).toBe(PantryStatus.Enough);
    });

    it('returns none for ingredients not in pantry', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(baseRecipe);
      mockPantryService.findAllForUser.mockResolvedValue([]);

      const result = await service.checkPantryStatus('recipe-1', 'user-1', 1);

      expect(result['0']).toBe(PantryStatus.None);
      expect(result['1']).toBe(PantryStatus.None);
    });

    it('handles recipe with no ingredients', async () => {
      mockRecipeRepo.findOne.mockResolvedValue({ id: 'recipe-1', ingredients: null });
      mockPantryService.findAllForUser.mockResolvedValue([]);

      const result = await service.checkPantryStatus('recipe-1', 'user-1', 1);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
