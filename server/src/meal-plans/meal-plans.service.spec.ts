import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { PantryService } from '../pantry/pantry.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsersService } from '../users/users.service';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { MessageType } from '@shared/enums';
import { ShoppingListsService } from '../shopping-lists/shopping-lists.service';

const mockMealPlanRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockEntryRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockRecipeRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockPantryService = {
  findAllForUser: jest.fn(),
  deductItems: jest.fn(),
};

const mockAnthropicService = {
  sendMessage: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
};

const mockFoodCacheService = {
  resolveIngredientNames: jest.fn(),
};

const mockShoppingListsService = {
  generateForMealPlan: jest.fn(),
};

describe('MealPlansService', () => {
  let service: MealPlansService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansService,
        { provide: getRepositoryToken(MealPlan), useValue: mockMealPlanRepo },
        { provide: getRepositoryToken(MealPlanEntry), useValue: mockEntryRepo },
        { provide: getRepositoryToken(Recipe), useValue: mockRecipeRepo },
        { provide: PantryService, useValue: mockPantryService },
        { provide: AnthropicService, useValue: mockAnthropicService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: FoodCacheService, useValue: mockFoodCacheService },
        { provide: ShoppingListsService, useValue: mockShoppingListsService },
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listPlans', () => {
    it('should return lightweight plan summaries sorted by weekStartDate DESC', async () => {
      const plans = [
        { id: 'p1', weekStartDate: '2026-03-02', status: 'active' },
        { id: 'p2', weekStartDate: '2026-02-23', status: 'active' },
      ];
      mockMealPlanRepo.find.mockResolvedValue(plans);

      const result = await service.listPlans('u1');

      expect(mockMealPlanRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        select: ['id', 'weekStartDate', 'status'],
        order: { weekStartDate: 'DESC' },
      });
      expect(result).toEqual(plans);
    });

    it('should return an empty array when user has no plans', async () => {
      mockMealPlanRepo.find.mockResolvedValue([]);

      const result = await service.listPlans('u1');

      expect(result).toEqual([]);
    });
  });

  describe('addEntry', () => {
    const mockPlan = { id: 'plan-1', userId: 'u1', status: 'active' };
    const mockPantryItems = [
      { id: 'pi-1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' },
    ];
    const mockParsedRecipe = {
      title: 'Grilled Chicken',
      description: 'A simple grilled chicken',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      totalTimeMinutes: 30,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'American',
      ingredients: [
        { name: 'Chicken Breast', quantity: 1, unit: 'lb', baseQuantity: 454, baseUnit: 'g' },
      ],
      steps: [{ stepNumber: 1, instruction: 'Grill the chicken' }],
      tags: ['grilled'],
      dietaryFlags: [],
      nutrition: { calories: 300, protein: 40, carbs: 0, fat: 8 },
    };

    const savedEntryResult = {
      id: 'entry-new',
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
      mealType: 'Breakfast',
      mealPlan: { userId: 'u1' },
      recipe: { ...mockParsedRecipe, id: 'recipe-new', ingredients: mockParsedRecipe.ingredients },
    };

    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    function setupCommonMocks() {
      mockMealPlanRepo.findOne.mockResolvedValue(mockPlan);
      // Reset findOne so no stale mockResolvedValueOnce values leak
      mockEntryRepo.findOne.mockReset();
      mockEntryRepo.findOne
        .mockResolvedValueOnce(null) // no existing entry for this slot
        .mockResolvedValueOnce(savedEntryResult); // returned entry after save
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);
      mockFoodCacheService.resolveIngredientNames.mockResolvedValue(
        new Map([['chicken breast', 'fc-1']]),
      );
      mockUsersService.findById.mockResolvedValue({ dietaryProfile: { householdSize: 2 } });
      mockRecipeRepo.create.mockImplementation((data) => data);
      mockRecipeRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'recipe-new' }));
      mockEntryRepo.create.mockImplementation((data) => data);
      mockEntryRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'entry-new' }));
      mockShoppingListsService.generateForMealPlan.mockResolvedValue(undefined);
    }

    it('should generate a meal via AI when no url is provided', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });

      const result = await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Breakfast' as any,
      });

      expect(result.id).toBe('entry-new');
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ messageType: MessageType.MealSwap }),
      );
      expect(mockRecipeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'ai', sourceUrl: null }),
      );
      expect(mockShoppingListsService.generateForMealPlan).toHaveBeenCalledWith('plan-1', 'u1');
    });

    it('should import a recipe from URL when url is provided', async () => {
      setupCommonMocks();
      // Mock global fetch for URL import
      const mockFetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('<html><body>Recipe content</body></html>'),
      });
      (global as any).fetch = mockFetch;

      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });

      const result = await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 2,
        mealType: 'Dinner' as any,
        url: 'https://example.com/recipe',
      });

      expect(result.id).toBe('entry-new');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/recipe');
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ messageType: MessageType.UrlImport }),
      );
      expect(mockRecipeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'website',
          sourceUrl: 'https://example.com/recipe',
        }),
      );
    });

    it('should throw NotFoundException when meal plan not found', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'bad-id',
          dayOfWeek: 1,
          mealType: 'Breakfast' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when plan is not active', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({
        ...mockPlan,
        status: 'draft',
      });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Breakfast' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when entry already exists for slot', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue(mockPlan);
      mockEntryRepo.findOne.mockResolvedValueOnce({ id: 'existing-entry' });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Breakfast' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadGatewayException when AI call fails', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockRejectedValue(new Error('API down'));

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Breakfast' as any,
        }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException when AI returns unparseable response', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json at all' }],
      });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Breakfast' as any,
        }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException when URL fetch fails', async () => {
      setupCommonMocks();
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Dinner' as any,
          url: 'https://bad-url.example.com',
        }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadRequestException when URL page has no recipe', async () => {
      setupCommonMocks();
      (global as any).fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('<html><body>No recipe here</body></html>'),
      });
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ error: 'No recipe found on this page.' }) }],
      });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Dinner' as any,
          url: 'https://example.com/no-recipe',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should import a recipe from photo when imageBase64 is provided', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });

      const result = await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 3,
        mealType: 'Lunch' as any,
        imageBase64: 'iVBORw0KGgoAAAANS...',
        mimeType: 'image/jpeg',
      });

      expect(result.id).toBe('entry-new');
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ messageType: MessageType.PhotoImport }),
      );
      // Verify multimodal content with image block
      const callArgs = mockAnthropicService.sendMessage.mock.calls[0][1];
      const content = callArgs.messages[0].content;
      expect(content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'image' }),
          expect.objectContaining({ type: 'text' }),
        ]),
      );
      expect(mockRecipeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'photo', sourceUrl: null }),
      );
    });

    it('should normalize image/jpg mimeType to image/jpeg for photo import', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });

      await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Dinner' as any,
        imageBase64: 'base64data',
        mimeType: 'image/jpg',
      });

      const callArgs = mockAnthropicService.sendMessage.mock.calls[0][1];
      const imageBlock = callArgs.messages[0].content[0];
      expect(imageBlock.source.media_type).toBe('image/jpeg');
    });

    it('should prioritize imageBase64 over url when both are provided', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });

      const result = await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Dinner' as any,
        imageBase64: 'base64data',
        mimeType: 'image/png',
        url: 'https://example.com/recipe',
      });

      expect(result.id).toBe('entry-new');
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ messageType: MessageType.PhotoImport }),
      );
      expect(mockRecipeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'photo' }),
      );
    });

    it('should throw BadRequestException when photo contains no recipe', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: "This image doesn't appear to contain a recipe.",
            }),
          },
        ],
      });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Dinner' as any,
          imageBase64: 'base64data',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadGatewayException when AI call fails for photo import', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockRejectedValue(new Error('API down'));

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Dinner' as any,
          imageBase64: 'base64data',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should throw BadGatewayException when photo AI response is unparseable', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json at all' }],
      });

      await expect(
        service.addEntry('u1', {
          mealPlanId: 'plan-1',
          dayOfWeek: 1,
          mealType: 'Dinner' as any,
          imageBase64: 'base64data',
          mimeType: 'image/jpeg',
        }),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should still return entry when shopping list regeneration fails', async () => {
      setupCommonMocks();
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockParsedRecipe) }],
      });
      mockShoppingListsService.generateForMealPlan.mockRejectedValue(
        new Error('Shopping list error'),
      );

      const result = await service.addEntry('u1', {
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Breakfast' as any,
      });

      expect(result.id).toBe('entry-new');
    });
  });

  describe('cookPreview', () => {
    const mockEntry = {
      id: 'entry-1',
      mealPlan: { userId: 'u1' },
      recipe: {
        title: 'Chicken Stir-Fry',
        ingredients: [
          { name: 'Chicken breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' },
          { name: 'Soy sauce', quantity: 3, unit: 'tbsp', baseQuantity: 44.361, baseUnit: 'ml', foodCacheId: 'fc-2' },
        ],
      },
    };

    const mockPantryItems = [
      { id: 'pi-1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' },
      { id: 'pi-2', displayName: 'Soy Sauce', quantity: 500, unit: 'ml', foodCacheId: 'fc-2' },
    ];

    it('should resolve all deductions deterministically without calling AI', async () => {
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.entryId).toBe('entry-1');
      expect(result.recipeTitle).toBe('Chicken Stir-Fry');
      expect(result.deductions).toHaveLength(2);
      // Chicken: same unit, direct deduction
      expect(result.deductions[0].pantryItemId).toBe('pi-1');
      expect(result.deductions[0].deductQuantity).toBe(1);
      // Soy sauce: tbsp → ml (same volume category)
      expect(result.deductions[1].pantryItemId).toBe('pi-2');
      expect(result.deductions[1].deductQuantity).toBeGreaterThan(0);
      // No AI call made
      expect(mockAnthropicService.sendMessage).not.toHaveBeenCalled();
      // needsAiConversion should be stripped from response
      expect(result.deductions[0]).not.toHaveProperty('needsAiConversion');
    });

    it('should call AI only for ingredients that need conversion', async () => {
      const entryWithGarlic = {
        ...mockEntry,
        recipe: {
          ...mockEntry.recipe,
          ingredients: [
            { name: 'Chicken breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' },
            { name: 'Garlic', quantity: 3, unit: 'clove', baseQuantity: 3, baseUnit: 'count', foodCacheId: 'fc-3' },
          ],
        },
      };
      const pantryWithGarlic = [
        ...mockPantryItems,
        { id: 'pi-3', displayName: 'Garlic', quantity: 2, unit: 'head', foodCacheId: 'fc-3' },
      ];
      mockEntryRepo.findOne.mockResolvedValue(entryWithGarlic);
      mockPantryService.findAllForUser.mockResolvedValue(pantryWithGarlic);
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: '[0.25]' }],
      });

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.deductions).toHaveLength(2);
      // Chicken resolved deterministically
      expect(result.deductions[0].pantryItemId).toBe('pi-1');
      expect(result.deductions[0].deductQuantity).toBe(1);
      // Garlic resolved via AI
      expect(result.deductions[1].pantryItemId).toBe('pi-3');
      expect(result.deductions[1].deductQuantity).toBe(0.25);
      // AI was called exactly once
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockAnthropicService.sendMessage).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ messageType: MessageType.CookDeduction }),
      );
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockEntryRepo.findOne.mockResolvedValue(null);

      await expect(service.cookPreview('u1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when entry belongs to different user', async () => {
      mockEntryRepo.findOne.mockResolvedValue({
        ...mockEntry,
        mealPlan: { userId: 'other-user' },
      });

      await expect(service.cookPreview('u1', 'entry-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should still return deductions when AI fallback fails', async () => {
      const entryWithGarlic = {
        ...mockEntry,
        recipe: {
          ...mockEntry.recipe,
          ingredients: [
            { name: 'Garlic', quantity: 3, unit: 'clove', baseQuantity: 3, baseUnit: 'count', foodCacheId: 'fc-3' },
          ],
        },
      };
      mockEntryRepo.findOne.mockResolvedValue(entryWithGarlic);
      mockPantryService.findAllForUser.mockResolvedValue([
        { id: 'pi-3', displayName: 'Garlic', quantity: 2, unit: 'head', foodCacheId: 'fc-3' },
      ]);
      mockAnthropicService.sendMessage.mockRejectedValue(new Error('API down'));

      const result = await service.cookPreview('u1', 'entry-1');

      // Should still return results with deductQuantity 0 for unresolved items
      expect(result.deductions).toHaveLength(1);
      expect(result.deductions[0].deductQuantity).toBe(0);
    });
  });

  describe('confirmCook', () => {
    const mockEntry = {
      id: 'entry-1',
      isCooked: false,
      mealPlan: { userId: 'u1' },
    };

    it('should deduct items and mark entry as cooked', async () => {
      mockEntryRepo.findOne.mockResolvedValue({ ...mockEntry });
      mockPantryService.deductItems.mockResolvedValue({
        updatedPantryIds: ['pi-1'],
        removedPantryIds: ['pi-2'],
      });
      mockEntryRepo.save.mockImplementation((e) => Promise.resolve(e));

      const dto = {
        deductions: [
          { pantryItemId: 'pi-1', deductQuantity: 1, deductUnit: 'lb' },
          { pantryItemId: 'pi-2', deductQuantity: 3, deductUnit: 'tbsp' },
        ],
      };

      const result = await service.confirmCook('u1', 'entry-1', dto);

      expect(result.entryId).toBe('entry-1');
      expect(result.isCooked).toBe(true);
      expect(result.pantryUpdated).toBe(1);
      expect(result.pantryRemoved).toBe(1);
      expect(mockPantryService.deductItems).toHaveBeenCalledWith(
        'u1',
        dto.deductions,
      );
      expect(mockEntryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isCooked: true }),
      );
    });

    it('should store servingsToCook and servingsToEat when provided', async () => {
      mockEntryRepo.findOne.mockResolvedValue({ ...mockEntry });
      mockPantryService.deductItems.mockResolvedValue({
        updatedPantryIds: [],
        removedPantryIds: [],
      });
      mockEntryRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.confirmCook('u1', 'entry-1', {
        deductions: [],
        servingsToCook: 4,
        servingsToEat: 2,
      });

      expect(result.isCooked).toBe(true);
      expect(mockEntryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isCooked: true,
          servingsToCook: 4,
          servings: 2,
        }),
      );
    });

    it('should not overwrite servings when servingsToCook/servingsToEat not provided', async () => {
      const entry = { ...mockEntry, servings: 3, servingsToCook: null };
      mockEntryRepo.findOne.mockResolvedValue(entry);
      mockPantryService.deductItems.mockResolvedValue({
        updatedPantryIds: [],
        removedPantryIds: [],
      });
      mockEntryRepo.save.mockImplementation((e) => Promise.resolve(e));

      await service.confirmCook('u1', 'entry-1', { deductions: [] });

      expect(mockEntryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          servings: 3,
          servingsToCook: null,
        }),
      );
    });

    it('should work with empty deductions array', async () => {
      mockEntryRepo.findOne.mockResolvedValue({ ...mockEntry });
      mockPantryService.deductItems.mockResolvedValue({
        updatedPantryIds: [],
        removedPantryIds: [],
      });
      mockEntryRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.confirmCook('u1', 'entry-1', {
        deductions: [],
      });

      expect(result.isCooked).toBe(true);
      expect(result.pantryUpdated).toBe(0);
      expect(result.pantryRemoved).toBe(0);
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockEntryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.confirmCook('u1', 'bad-id', { deductions: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when entry belongs to different user', async () => {
      mockEntryRepo.findOne.mockResolvedValue({
        ...mockEntry,
        mealPlan: { userId: 'other-user' },
      });

      await expect(
        service.confirmCook('u1', 'entry-1', { deductions: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cookPreview with scaling', () => {
    const mockPantryItems = [
      { id: 'pi-1', displayName: 'Chicken Breast', quantity: 10, unit: 'lb', foodCacheId: 'fc-1' },
    ];

    it('should scale ingredient quantities when servingsToCook is provided', async () => {
      const mockEntry = {
        id: 'entry-1',
        servingsToCook: null,
        mealPlan: { userId: 'u1' },
        recipe: {
          title: 'Chicken',
          servings: 2,
          ingredients: [
            { name: 'Chicken breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' },
          ],
        },
      };
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);

      // Cook 4 servings of a recipe that serves 2 → scale = 2x
      const result = await service.cookPreview('u1', 'entry-1', 4);

      expect(result.deductions).toHaveLength(1);
      expect(result.deductions[0].deductQuantity).toBe(2); // 1 lb * 2 = 2 lb
    });

    it('should use entry.servingsToCook when no explicit param given', async () => {
      const mockEntry = {
        id: 'entry-1',
        servingsToCook: 6,
        mealPlan: { userId: 'u1' },
        recipe: {
          title: 'Chicken',
          servings: 2,
          ingredients: [
            { name: 'Chicken breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' },
          ],
        },
      };
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);

      // entry.servingsToCook=6, recipe.servings=2 → scale = 3x
      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.deductions[0].deductQuantity).toBe(3); // 1 lb * 3 = 3 lb
    });

    it('should default to scale=1 when no servingsToCook is set anywhere', async () => {
      const mockEntry = {
        id: 'entry-1',
        servingsToCook: null,
        mealPlan: { userId: 'u1' },
        recipe: {
          title: 'Chicken',
          servings: 2,
          ingredients: [
            { name: 'Chicken breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' },
          ],
        },
      };
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.deductions[0].deductQuantity).toBe(1); // no scaling
    });

    it('should scale baseQuantity for cross-unit conversion (cup recipe → g pantry)', async () => {
      const mockEntry = {
        id: 'entry-1',
        servingsToCook: null,
        mealPlan: { userId: 'u1' },
        recipe: {
          title: 'Lentil Soup',
          servings: 2,
          ingredients: [
            { name: 'Green Lentils', quantity: 1, unit: 'cup', baseQuantity: 236.588, baseUnit: 'ml', foodCacheId: 'fc-10' },
          ],
        },
      };
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue([
        { id: 'pi-10', displayName: 'Green Lentils', quantity: 1000, unit: 'ml', foodCacheId: 'fc-10' },
      ]);

      // 2 servings (scale=1): 1 cup = 236.588 ml
      const result1 = await service.cookPreview('u1', 'entry-1', 2);
      expect(result1.deductions[0].deductQuantity).toBeCloseTo(236.59, 0);

      // 4 servings (scale=2): 2 cups = 473.176 ml
      const result2 = await service.cookPreview('u1', 'entry-1', 4);
      expect(result2.deductions[0].deductQuantity).toBeCloseTo(473.18, 0);
    });
  });

  describe('getAvailableLeftovers', () => {
    it('should return entries with available leftover servings', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.find.mockResolvedValue([
        {
          id: 'entry-1',
          recipeId: 'recipe-1',
          servings: 2,
          servingsToCook: 4,
          leftoverSourceEntryId: null,
          recipe: { title: 'Chicken', imageUrl: null },
          leftoverEntries: [],
        },
      ]);

      const result = await service.getAvailableLeftovers('u1', 'plan-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sourceEntryId: 'entry-1',
        recipeId: 'recipe-1',
        recipeTitle: 'Chicken',
        recipeImageUrl: null,
        availableServings: 2, // 4 cook - 2 eat = 2 available
      });
    });

    it('should subtract already-assigned leftover servings', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.find.mockResolvedValue([
        {
          id: 'entry-1',
          recipeId: 'recipe-1',
          servings: 2,
          servingsToCook: 6,
          leftoverSourceEntryId: null,
          recipe: { title: 'Chicken', imageUrl: null },
          leftoverEntries: [
            { servings: 1 },
            { servings: 1 },
          ],
        },
      ]);

      const result = await service.getAvailableLeftovers('u1', 'plan-1');

      expect(result).toHaveLength(1);
      // 6 cook - 2 eat - 2 assigned = 2 available
      expect(result[0].availableServings).toBe(2);
    });

    it('should exclude entries with no leftover capacity', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.find.mockResolvedValue([
        {
          id: 'entry-1',
          recipeId: 'recipe-1',
          servings: 2,
          servingsToCook: 2, // cook = eat, no leftovers
          leftoverSourceEntryId: null,
          recipe: { title: 'Chicken', imageUrl: null },
          leftoverEntries: [],
        },
        {
          id: 'entry-2',
          recipeId: 'recipe-2',
          servings: 2,
          servingsToCook: null, // no servingsToCook set
          leftoverSourceEntryId: null,
          recipe: { title: 'Pasta', imageUrl: null },
          leftoverEntries: [],
        },
      ]);

      const result = await service.getAvailableLeftovers('u1', 'plan-1');

      expect(result).toHaveLength(0);
    });

    it('should exclude fully-assigned leftovers', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.find.mockResolvedValue([
        {
          id: 'entry-1',
          recipeId: 'recipe-1',
          servings: 2,
          servingsToCook: 4,
          leftoverSourceEntryId: null,
          recipe: { title: 'Chicken', imageUrl: null },
          leftoverEntries: [{ servings: 2 }], // all leftovers assigned
        },
      ]);

      const result = await service.getAvailableLeftovers('u1', 'plan-1');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailableLeftovers('u1', 'bad-plan'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addLeftoverEntry', () => {
    it('should create a leftover entry', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.findOne
        .mockResolvedValueOnce({
          id: 'source-1',
          mealPlanId: 'plan-1',
          recipeId: 'recipe-1',
          servings: 2,
          servingsToCook: 4,
          leftoverEntries: [],
        })
        .mockResolvedValueOnce({
          id: 'leftover-1',
          recipeId: 'recipe-1',
          dayOfWeek: 2,
          mealType: 'Dinner',
          servings: 1,
          leftoverSourceEntryId: 'source-1',
          isLocked: true,
          recipe: { title: 'Chicken' },
        });
      mockEntryRepo.create.mockImplementation((data) => data);
      mockEntryRepo.save.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 'leftover-1' }),
      );

      const result = await service.addLeftoverEntry('u1', {
        mealPlanId: 'plan-1',
        sourceEntryId: 'source-1',
        dayOfWeek: 2,
        mealType: 'Dinner' as any,
        servings: 1,
      });

      expect(result.id).toBe('leftover-1');
      expect(mockEntryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mealPlanId: 'plan-1',
          recipeId: 'recipe-1',
          leftoverSourceEntryId: 'source-1',
          isLocked: true,
          servings: 1,
        }),
      );
    });

    it('should throw BadRequestException when requesting more servings than available', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.findOne.mockResolvedValueOnce({
        id: 'source-1',
        mealPlanId: 'plan-1',
        recipeId: 'recipe-1',
        servings: 2,
        servingsToCook: 4,
        leftoverEntries: [{ servings: 1 }], // 1 already assigned
      });

      // Available = 4 - 2 - 1 = 1, requesting 2
      await expect(
        service.addLeftoverEntry('u1', {
          mealPlanId: 'plan-1',
          sourceEntryId: 'source-1',
          dayOfWeek: 2,
          mealType: 'Dinner' as any,
          servings: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when source has no servingsToCook', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.findOne.mockResolvedValueOnce({
        id: 'source-1',
        mealPlanId: 'plan-1',
        servingsToCook: null,
        leftoverEntries: [],
      });

      await expect(
        service.addLeftoverEntry('u1', {
          mealPlanId: 'plan-1',
          sourceEntryId: 'source-1',
          dayOfWeek: 2,
          mealType: 'Dinner' as any,
          servings: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when source entry not found', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue({ id: 'plan-1', userId: 'u1' });
      mockEntryRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.addLeftoverEntry('u1', {
          mealPlanId: 'plan-1',
          sourceEntryId: 'bad-id',
          dayOfWeek: 2,
          mealType: 'Dinner' as any,
          servings: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when plan not found', async () => {
      mockMealPlanRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addLeftoverEntry('u1', {
          mealPlanId: 'bad-plan',
          sourceEntryId: 'source-1',
          dayOfWeek: 2,
          mealType: 'Dinner' as any,
          servings: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
