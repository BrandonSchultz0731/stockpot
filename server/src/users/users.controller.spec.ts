import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  getProfile: jest.fn(),
  completeOnboarding: jest.fn(),
  updateProfile: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should delegate to UsersService.getProfile with userId', async () => {
      const profile = { id: 'u1', email: 'a@b.com', firstName: 'Test' };
      mockUsersService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile('u1');

      expect(mockUsersService.getProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual(profile);
    });
  });

  describe('completeOnboarding', () => {
    it('should delegate to UsersService.completeOnboarding', async () => {
      const dto = {
        dietaryProfile: { diets: [], excludedIngredients: [], householdSize: 2, cookingSkill: 'Intermediate' },
        nutritionalGoals: { goalType: 'Maintain', dailyCalories: 2000, dailyProteinGrams: 150, dailyCarbsGrams: 250, dailyFatGrams: 65 },
      };
      mockUsersService.completeOnboarding.mockResolvedValue({ success: true });

      const result = await controller.completeOnboarding('u1', dto as any);

      expect(mockUsersService.completeOnboarding).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateProfile', () => {
    it('should delegate to UsersService.updateProfile', async () => {
      const dto = {
        dietaryProfile: { diets: ['Keto'], excludedIngredients: [], householdSize: 1, cookingSkill: 'Beginner' },
      };
      const updatedProfile = { id: 'u1', email: 'a@b.com', firstName: 'Test', dietaryProfile: dto.dietaryProfile };
      mockUsersService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile('u1', dto as any);

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual(updatedProfile);
    });
  });
});
