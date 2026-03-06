import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AppleAuthService } from '../auth/apple-auth.service';

const mockUsersService = {
  getProfile: jest.fn(),
  completeOnboarding: jest.fn(),
  updateProfile: jest.fn(),
  deleteAccount: jest.fn(),
};

const mockAppleAuthService = {
  revokeToken: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AppleAuthService, useValue: mockAppleAuthService },
      ],
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

  describe('deleteAccount', () => {
    it('should delete account and revoke Apple token', async () => {
      mockUsersService.deleteAccount.mockResolvedValue({
        success: true,
        appleRefreshToken: 'apple-rt',
      });
      mockAppleAuthService.revokeToken.mockResolvedValue(undefined);

      await controller.deleteAccount('u1');

      expect(mockUsersService.deleteAccount).toHaveBeenCalledWith('u1');
      expect(mockAppleAuthService.revokeToken).toHaveBeenCalledWith('apple-rt');
    });

    it('should pass null to revokeToken for non-Apple users', async () => {
      mockUsersService.deleteAccount.mockResolvedValue({
        success: true,
        appleRefreshToken: null,
      });
      mockAppleAuthService.revokeToken.mockResolvedValue(undefined);

      await controller.deleteAccount('u1');

      expect(mockAppleAuthService.revokeToken).toHaveBeenCalledWith(null);
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
