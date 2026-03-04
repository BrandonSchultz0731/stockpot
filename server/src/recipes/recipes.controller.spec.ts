import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { PantryStatus } from '@shared/enums';

const mockRecipesService = {
  generateRecipes: jest.fn(),
  findById: jest.fn(),
  checkPantryStatus: jest.fn(),
  getSavedRecipes: jest.fn(),
  saveRecipe: jest.fn(),
  unsaveRecipe: jest.fn(),
  updateSavedRecipe: jest.fn(),
};

describe('RecipesController', () => {
  let controller: RecipesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        { provide: RecipesService, useValue: mockRecipesService },
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkPantryStatus', () => {
    it('delegates to RecipesService.checkPantryStatus', async () => {
      const expected = { '0': PantryStatus.Enough, '1': PantryStatus.Low };
      mockRecipesService.checkPantryStatus.mockResolvedValue(expected);

      const result = await controller.checkPantryStatus('user-1', 'recipe-1', { scale: 3 });

      expect(mockRecipesService.checkPantryStatus).toHaveBeenCalledWith('recipe-1', 'user-1', 3);
      expect(result).toEqual(expected);
    });
  });
});
