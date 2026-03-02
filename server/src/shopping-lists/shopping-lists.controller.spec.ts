import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';

const mockShoppingListsService = {
  getByMealPlan: jest.fn(),
  addCustomItem: jest.fn(),
  toggleItem: jest.fn(),
};

describe('ShoppingListsController', () => {
  let controller: ShoppingListsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingListsController],
      providers: [
        { provide: ShoppingListsService, useValue: mockShoppingListsService },
      ],
    }).compile();

    controller = module.get<ShoppingListsController>(ShoppingListsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getByMealPlan', () => {
    it('should delegate to ShoppingListsService.getByMealPlan', async () => {
      const response = { id: 'list-1', items: [], summary: {} };
      mockShoppingListsService.getByMealPlan.mockResolvedValue(response);

      const result = await controller.getByMealPlan('u1', 'plan-1');

      expect(mockShoppingListsService.getByMealPlan).toHaveBeenCalledWith('u1', 'plan-1');
      expect(result).toEqual(response);
    });
  });

  describe('addCustomItem', () => {
    it('should delegate to ShoppingListsService.addCustomItem', async () => {
      const dto = { displayName: 'Paper Towels', quantity: 2, unit: 'rolls' };
      const response = { id: 'list-1', items: [], summary: {} };
      mockShoppingListsService.addCustomItem.mockResolvedValue(response);

      const result = await controller.addCustomItem('u1', 'list-1', dto);

      expect(mockShoppingListsService.addCustomItem).toHaveBeenCalledWith('u1', 'list-1', dto);
      expect(result).toEqual(response);
    });
  });

  describe('toggleItem', () => {
    it('should delegate to ShoppingListsService.toggleItem', async () => {
      const response = { id: 'list-1', items: [], summary: {} };
      mockShoppingListsService.toggleItem.mockResolvedValue(response);

      const result = await controller.toggleItem('u1', 'list-1', 'item-1');

      expect(mockShoppingListsService.toggleItem).toHaveBeenCalledWith('u1', 'list-1', 'item-1');
      expect(result).toEqual(response);
    });
  });
});
