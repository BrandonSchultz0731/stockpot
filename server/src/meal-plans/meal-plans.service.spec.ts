import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadGatewayException } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { MealPlan } from './entities/meal-plan.entity';
import { MealPlanEntry } from './entities/meal-plan-entry.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { PantryService } from '../pantry/pantry.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { UsersService } from '../users/users.service';
import { FoodCacheService } from '../food-cache/food-cache.service';
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

const mockUsageTrackingService = {
  increment: jest.fn(),
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
        { provide: UsageTrackingService, useValue: mockUsageTrackingService },
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
        expect.objectContaining({ messageType: 'cook-deduction' }),
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
