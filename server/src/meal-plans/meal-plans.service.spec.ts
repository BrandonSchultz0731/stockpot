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
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockEntryRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
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
          { name: 'Chicken breast', quantity: 1, unit: 'lb', foodCacheId: 'fc-1' },
          { name: 'Soy sauce', quantity: 3, unit: 'tbsp', foodCacheId: 'fc-2' },
        ],
      },
    };

    const mockPantryItems = [
      { id: 'pi-1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' },
      { id: 'pi-2', displayName: 'Soy Sauce', quantity: 1, unit: 'bottle', foodCacheId: 'fc-2' },
    ];

    const aiDeductions = {
      deductions: [
        {
          recipeIngredientName: 'Chicken breast',
          pantryItemId: 'pi-1',
          pantryItemName: 'Chicken Breast',
          currentQuantity: 2,
          currentUnit: 'lb',
          deductQuantity: 1,
          deductUnit: 'lb',
          notes: 'Direct match',
        },
      ],
    };

    it('should return deduction suggestions from AI', async () => {
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(aiDeductions) }],
      });

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.entryId).toBe('entry-1');
      expect(result.recipeTitle).toBe('Chicken Stir-Fry');
      expect(result.deductions).toEqual(aiDeductions.deductions);
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

    it('should throw BadGatewayException when AI call fails', async () => {
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);
      mockAnthropicService.sendMessage.mockRejectedValue(new Error('API down'));

      await expect(service.cookPreview('u1', 'entry-1')).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should return empty deductions when AI returns unparseable response', async () => {
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [{ type: 'text', text: 'not valid json' }],
      });

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.deductions).toEqual([]);
    });

    it('should parse AI response wrapped in code block', async () => {
      mockEntryRepo.findOne.mockResolvedValue(mockEntry);
      mockPantryService.findAllForUser.mockResolvedValue(mockPantryItems);
      mockAnthropicService.sendMessage.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(aiDeductions) + '\n```',
          },
        ],
      });

      const result = await service.cookPreview('u1', 'entry-1');

      expect(result.deductions).toEqual(aiDeductions.deductions);
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
});
