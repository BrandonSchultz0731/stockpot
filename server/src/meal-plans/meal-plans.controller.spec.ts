import { Test, TestingModule } from '@nestjs/testing';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

const mockMealPlansService = {
  generatePlan: jest.fn(),
  getCurrentPlan: jest.fn(),
  getPlanByWeek: jest.fn(),
  updateEntry: jest.fn(),
  swapEntry: jest.fn(),
  cookPreview: jest.fn(),
  confirmCook: jest.fn(),
  deletePlan: jest.fn(),
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

      const result = await controller.cookPreview('u1', 'entry-1');

      expect(mockMealPlansService.cookPreview).toHaveBeenCalledWith(
        'u1',
        'entry-1',
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
});
