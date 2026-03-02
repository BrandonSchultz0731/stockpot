import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingList } from './entities/shopping-list.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { PantryService } from '../pantry/pantry.service';
import { FoodCacheService } from '../food-cache/food-cache.service';
import { PantryStatus, DEFAULT_FOOD_CATEGORY } from '@shared/enums';

const mockShoppingListRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockEntryRepo = {
  find: jest.fn(),
};

const mockPantryService = {
  findAllForUser: jest.fn(),
};

const mockFoodCacheService = {
  getCategoriesByIds: jest.fn(),
  backfillCategories: jest.fn(),
};

function makeList(overrides: Partial<ShoppingList> = {}): ShoppingList {
  return {
    id: 'list-1',
    userId: 'u1',
    mealPlanId: 'plan-1',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ShoppingList;
}

function makeRecipeItem(overrides: Record<string, any> = {}) {
  return {
    id: 'item-1',
    displayName: 'Chicken Breast',
    quantity: 2,
    unit: 'lb',
    baseQuantity: 907.185,
    baseUnit: 'g',
    foodCacheId: 'fc-1',
    category: 'Meat & Poultry',
    pantryStatus: PantryStatus.None,
    neededQuantity: 2,
    isChecked: false,
    isCustom: false,
    recipeCount: 1,
    ...overrides,
  };
}

function makeCustomItem(overrides: Record<string, any> = {}) {
  return {
    id: 'custom-1',
    displayName: 'Paper Towels',
    quantity: 2,
    unit: 'rolls',
    baseQuantity: 2,
    baseUnit: 'rolls',
    foodCacheId: null,
    category: DEFAULT_FOOD_CATEGORY,
    pantryStatus: PantryStatus.NA,
    neededQuantity: 2,
    isChecked: false,
    isCustom: true,
    recipeCount: 0,
    ...overrides,
  };
}

describe('ShoppingListsService', () => {
  let service: ShoppingListsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListsService,
        { provide: getRepositoryToken(ShoppingList), useValue: mockShoppingListRepo },
        { provide: getRepositoryToken(MealPlanEntry), useValue: mockEntryRepo },
        { provide: PantryService, useValue: mockPantryService },
        { provide: FoodCacheService, useValue: mockFoodCacheService },
      ],
    }).compile();

    service = module.get<ShoppingListsService>(ShoppingListsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // addCustomItem
  // ---------------------------------------------------------------------------
  describe('addCustomItem', () => {
    it('should add a custom item to an existing list', async () => {
      const list = makeList({ items: [makeRecipeItem()] });
      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      const dto = { displayName: 'Paper Towels', quantity: 2, unit: 'rolls' };
      const result = await service.addCustomItem('u1', 'list-1', dto);

      expect(mockShoppingListRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'list-1', userId: 'u1' },
      });
      expect(mockShoppingListRepo.save).toHaveBeenCalled();

      // Should contain both the original recipe item and the new custom item
      expect(result.items).toHaveLength(2);

      const custom = result.items.find((i) => i.isCustom);
      expect(custom).toBeDefined();
      expect(custom!.displayName).toBe('Paper Towels');
      expect(custom!.quantity).toBe(2);
      expect(custom!.unit).toBe('rolls');
      expect(custom!.pantryStatus).toBe(PantryStatus.NA);
      expect(custom!.foodCacheId).toBeNull();
      expect(custom!.isCustom).toBe(true);
      expect(custom!.recipeCount).toBe(0);
      expect(custom!.isChecked).toBe(false);
    });

    it('should default category to DEFAULT_FOOD_CATEGORY when not provided', async () => {
      const list = makeList();
      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      const dto = { displayName: 'Sponge', quantity: 1, unit: 'count' };
      const result = await service.addCustomItem('u1', 'list-1', dto);

      const custom = result.items.find((i) => i.isCustom);
      expect(custom!.category).toBe(DEFAULT_FOOD_CATEGORY);
    });

    it('should use provided category', async () => {
      const list = makeList();
      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      const dto = { displayName: 'Chips', quantity: 1, unit: 'bag', category: 'Snacks' };
      const result = await service.addCustomItem('u1', 'list-1', dto);

      const custom = result.items.find((i) => i.isCustom);
      expect(custom!.category).toBe('Snacks');
    });

    it('should throw NotFoundException when list not found', async () => {
      mockShoppingListRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addCustomItem('u1', 'nonexistent', {
          displayName: 'Test',
          quantity: 1,
          unit: 'count',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should count custom item (NA) in toBuy summary', async () => {
      const list = makeList();
      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      const dto = { displayName: 'Paper Towels', quantity: 1, unit: 'roll' };
      const result = await service.addCustomItem('u1', 'list-1', dto);

      expect(result.summary.toBuy).toBe(1);
      expect(result.summary.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getByMealPlan — custom items should not be re-enriched
  // ---------------------------------------------------------------------------
  describe('getByMealPlan', () => {
    it('should throw NotFoundException when list not found', async () => {
      mockShoppingListRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getByMealPlan('u1', 'plan-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should preserve PantryStatus.NA on custom items during re-enrichment', async () => {
      const custom = makeCustomItem();
      const recipe = makeRecipeItem();
      const list = makeList({ items: [recipe, custom] });

      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockPantryService.findAllForUser.mockResolvedValue([]);

      const result = await service.getByMealPlan('u1', 'plan-1');

      const customResult = result.items.find((i) => i.isCustom);
      expect(customResult!.pantryStatus).toBe(PantryStatus.NA);
    });

    it('should re-enrich recipe items but skip custom items', async () => {
      const custom = makeCustomItem({ neededQuantity: 2 });
      const recipe = makeRecipeItem({ pantryStatus: PantryStatus.None, neededQuantity: 2 });
      const list = makeList({ items: [recipe, custom] });

      mockShoppingListRepo.findOne.mockResolvedValue(list);
      // Pantry has enough chicken to cover the recipe item
      mockPantryService.findAllForUser.mockResolvedValue([
        { foodCacheId: 'fc-1', quantity: 10, unit: 'lb' },
      ]);

      const result = await service.getByMealPlan('u1', 'plan-1');

      const recipeResult = result.items.find((i) => !i.isCustom);
      expect(recipeResult!.pantryStatus).toBe(PantryStatus.Enough);

      // Custom item should remain untouched
      const customResult = result.items.find((i) => i.isCustom);
      expect(customResult!.pantryStatus).toBe(PantryStatus.NA);
      expect(customResult!.neededQuantity).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // toggleItem — custom items should not be re-enriched
  // ---------------------------------------------------------------------------
  describe('toggleItem', () => {
    it('should toggle isChecked on a custom item', async () => {
      const custom = makeCustomItem({ isChecked: false });
      const list = makeList({ items: [custom] });

      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));
      mockPantryService.findAllForUser.mockResolvedValue([]);

      const result = await service.toggleItem('u1', 'list-1', 'custom-1');

      const toggled = result.items.find((i) => i.id === 'custom-1');
      expect(toggled!.isChecked).toBe(true);
    });

    it('should preserve PantryStatus.NA on custom items after toggle', async () => {
      const custom = makeCustomItem();
      const list = makeList({ items: [custom] });

      mockShoppingListRepo.findOne.mockResolvedValue(list);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));
      mockPantryService.findAllForUser.mockResolvedValue([]);

      const result = await service.toggleItem('u1', 'list-1', 'custom-1');

      const customResult = result.items.find((i) => i.isCustom);
      expect(customResult!.pantryStatus).toBe(PantryStatus.NA);
    });

    it('should throw NotFoundException when list not found', async () => {
      mockShoppingListRepo.findOne.mockResolvedValue(null);

      await expect(
        service.toggleItem('u1', 'nonexistent', 'item-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item not found', async () => {
      const list = makeList({ items: [makeRecipeItem()] });
      mockShoppingListRepo.findOne.mockResolvedValue(list);

      await expect(
        service.toggleItem('u1', 'list-1', 'nonexistent-item'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // generateForMealPlan — custom items should be preserved
  // ---------------------------------------------------------------------------
  describe('generateForMealPlan', () => {
    it('should preserve custom items when regenerating an existing list', async () => {
      const custom = makeCustomItem();
      const existingList = makeList({ items: [makeRecipeItem(), custom] });

      mockEntryRepo.find.mockResolvedValue([
        {
          mealPlanId: 'plan-1',
          recipe: {
            ingredients: [
              {
                name: 'Rice',
                quantity: 1,
                unit: 'cup',
                baseQuantity: 236.588,
                baseUnit: 'ml',
                foodCacheId: 'fc-2',
              },
            ],
          },
        },
      ]);
      mockPantryService.findAllForUser.mockResolvedValue([]);
      mockFoodCacheService.getCategoriesByIds.mockResolvedValue(new Map([['fc-2', 'Grains & Bread']]));
      mockShoppingListRepo.findOne.mockResolvedValue(existingList);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      await service.generateForMealPlan('plan-1', 'u1');

      const savedList = mockShoppingListRepo.save.mock.calls[0][0];
      const customItems = savedList.items.filter((i) => i.isCustom);
      expect(customItems).toHaveLength(1);
      expect(customItems[0].displayName).toBe('Paper Towels');
    });

    it('should not include custom items when creating a brand new list', async () => {
      mockEntryRepo.find.mockResolvedValue([
        {
          mealPlanId: 'plan-1',
          recipe: {
            ingredients: [
              {
                name: 'Flour',
                quantity: 2,
                unit: 'cup',
                baseQuantity: 0,
                baseUnit: 'ml',
                foodCacheId: null,
              },
            ],
          },
        },
      ]);
      mockPantryService.findAllForUser.mockResolvedValue([]);
      mockFoodCacheService.getCategoriesByIds.mockResolvedValue(new Map());
      mockShoppingListRepo.findOne.mockResolvedValue(null);

      const created = makeList();
      mockShoppingListRepo.create.mockReturnValue(created);
      mockShoppingListRepo.save.mockImplementation((l) => Promise.resolve(l));

      await service.generateForMealPlan('plan-1', 'u1');

      expect(mockShoppingListRepo.create).toHaveBeenCalled();
      const savedList = mockShoppingListRepo.save.mock.calls[0][0];
      const customItems = savedList.items.filter((i) => i.isCustom);
      expect(customItems).toHaveLength(0);
    });
  });
});
