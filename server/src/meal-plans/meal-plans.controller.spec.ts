import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

const mockMealPlansService = {
  listPlans: jest.fn(),
  generatePlan: jest.fn(),
  getCurrentPlan: jest.fn(),
  getPlanByWeek: jest.fn(),
  addEntry: jest.fn(),
  updateEntry: jest.fn(),
  swapEntry: jest.fn(),
  cookPreview: jest.fn(),
  confirmCook: jest.fn(),
  deletePlan: jest.fn(),
  getAvailableLeftovers: jest.fn(),
  addLeftoverEntry: jest.fn(),
};

describe('MealPlansController', () => {
  let controller: MealPlansController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlansController],
      providers: [
        { provide: MealPlansService, useValue: mockMealPlansService },
      ],
    }).compile();

    controller = module.get<MealPlansController>(MealPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listPlans', () => {
    it('should delegate to MealPlansService.listPlans', async () => {
      const plans = [
        { id: 'p1', weekStartDate: '2026-03-02', status: 'active' },
        { id: 'p2', weekStartDate: '2026-02-23', status: 'active' },
      ];
      mockMealPlansService.listPlans.mockResolvedValue(plans);

      const result = await controller.listPlans('u1');

      expect(mockMealPlansService.listPlans).toHaveBeenCalledWith('u1');
      expect(result).toEqual(plans);
    });
  });

  describe('addEntry', () => {
    it('should delegate to MealPlansService.addEntry', async () => {
      const dto = {
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Breakfast',
      };
      const entryResult = {
        id: 'entry-new',
        mealPlanId: 'plan-1',
        dayOfWeek: 1,
        mealType: 'Breakfast',
        recipe: { title: 'Pancakes' },
      };
      mockMealPlansService.addEntry.mockResolvedValue(entryResult);

      const result = await controller.addEntry('u1', dto as any);

      expect(mockMealPlansService.addEntry).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual(entryResult);
    });
  });

  describe('cookPreview', () => {
    it('should delegate to MealPlansService.cookPreview', async () => {
      const previewResult = {
        entryId: 'entry-1',
        recipeTitle: 'Chicken Stir-Fry',
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
      mockMealPlansService.cookPreview.mockResolvedValue(previewResult);

      const result = await controller.cookPreview('u1', 'entry-1', {});

      expect(mockMealPlansService.cookPreview).toHaveBeenCalledWith(
        'u1',
        'entry-1',
        undefined,
      );
      expect(result).toEqual(previewResult);
    });
  });

  describe('confirmCook', () => {
    it('should delegate to MealPlansService.confirmCook', async () => {
      const dto = {
        deductions: [
          { pantryItemId: 'pi-1', deductQuantity: 1, deductUnit: 'lb' },
        ],
      };
      const confirmResult = {
        entryId: 'entry-1',
        isCooked: true,
        pantryUpdated: 1,
        pantryRemoved: 0,
      };
      mockMealPlansService.confirmCook.mockResolvedValue(confirmResult);

      const result = await controller.confirmCook('u1', 'entry-1', dto);

      expect(mockMealPlansService.confirmCook).toHaveBeenCalledWith(
        'u1',
        'entry-1',
        dto,
      );
      expect(result).toEqual(confirmResult);
    });
  });

  describe('cookPreview with servingsToCook', () => {
    it('should pass servingsToCook from body to service', async () => {
      const previewResult = { entryId: 'entry-1', recipeTitle: 'Test', deductions: [] };
      mockMealPlansService.cookPreview.mockResolvedValue(previewResult);

      const result = await controller.cookPreview('u1', 'entry-1', { servingsToCook: 6 });

      expect(mockMealPlansService.cookPreview).toHaveBeenCalledWith('u1', 'entry-1', 6);
      expect(result).toEqual(previewResult);
    });
  });

  describe('getAvailableLeftovers', () => {
    it('should delegate to MealPlansService.getAvailableLeftovers', async () => {
      const leftovers = [
        { sourceEntryId: 'e1', recipeId: 'r1', recipeTitle: 'Chicken', recipeImageUrl: null, availableServings: 2 },
      ];
      mockMealPlansService.getAvailableLeftovers.mockResolvedValue(leftovers);

      const result = await controller.getAvailableLeftovers('u1', 'plan-1');

      expect(mockMealPlansService.getAvailableLeftovers).toHaveBeenCalledWith('u1', 'plan-1');
      expect(result).toEqual(leftovers);
    });
  });

  describe('addLeftoverEntry', () => {
    it('should delegate to MealPlansService.addLeftoverEntry', async () => {
      const dto = {
        mealPlanId: 'plan-1',
        sourceEntryId: 'source-1',
        dayOfWeek: 2,
        mealType: 'Dinner',
        servings: 1,
      };
      const entryResult = {
        id: 'leftover-1',
        recipeId: 'recipe-1',
        leftoverSourceEntryId: 'source-1',
      };
      mockMealPlansService.addLeftoverEntry.mockResolvedValue(entryResult);

      const result = await controller.addLeftoverEntry('u1', dto as any);

      expect(mockMealPlansService.addLeftoverEntry).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual(entryResult);
    });
  });
});
