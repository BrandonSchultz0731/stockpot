import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { CookingSkill, DietaryPreference, GoalType } from '@shared/enums';

jest.mock('bcrypt');

const mockUsersRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockSessionsRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(UserSession), useValue: mockSessionsRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('should hash password and create user', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const createdUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-pw',
        firstName: 'Test',
      };
      mockUsersRepo.create.mockReturnValue(createdUser);
      mockUsersRepo.save.mockResolvedValue(createdUser);

      const result = await service.createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          passwordHash: 'hashed-pw',
          firstName: 'Test',
          lastName: undefined,
          notificationPrefs: expect.objectContaining({ expiringItems: true }),
        }),
      );
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockUsersRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser({
          email: 'dup@example.com',
          password: 'pass',
          firstName: 'Dup',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should store optional lastName', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('h');
      mockUsersRepo.create.mockReturnValue({});
      mockUsersRepo.save.mockResolvedValue({});

      await service.createUser({
        email: 'a@b.com',
        password: 'p',
        firstName: 'F',
        lastName: 'L',
      });

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ lastName: 'L' }),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(result).toEqual(user);
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
    });

    it('should return null when not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nope@b.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: 'u1' };
      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findById('u1');

      expect(result).toEqual(user);
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
    });

    it('should return null when not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('nope');

      expect(result).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should return true for matching password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword('wrong', 'hashed');

      expect(result).toBe(false);
    });

    it('should return false for null hash (social-only user)', async () => {
      const result = await service.validatePassword('any-password', null);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('findByProviderUserId', () => {
    it('should return user when found', async () => {
      const user = { id: 'u1', authProvider: 'google', providerUserId: 'g-123' };
      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByProviderUserId('google', 'g-123');

      expect(result).toEqual(user);
      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { authProvider: 'google', providerUserId: 'g-123' },
      });
    });

    it('should return null when not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.findByProviderUserId('apple', 'nope');

      expect(result).toBeNull();
    });
  });

  describe('createSocialUser', () => {
    it('should create user with null passwordHash', async () => {
      const userData = {
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
        authProvider: 'google',
        providerUserId: 'g-123',
      };
      const createdUser = { id: 'u1', ...userData, passwordHash: null };
      mockUsersRepo.create.mockReturnValue(createdUser);
      mockUsersRepo.save.mockResolvedValue(createdUser);

      const result = await service.createSocialUser(userData);

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'social@example.com',
          passwordHash: null,
          firstName: 'Social',
          lastName: 'User',
          authProvider: 'google',
          providerUserId: 'g-123',
          notificationPrefs: expect.objectContaining({ expiringItems: true }),
        }),
      );
      expect(result).toEqual(createdUser);
    });

    it('should store avatarUrl when provided', async () => {
      const userData = {
        email: 'social@example.com',
        firstName: 'Social',
        authProvider: 'google',
        providerUserId: 'g-123',
        avatarUrl: 'https://example.com/photo.jpg',
      };
      mockUsersRepo.create.mockReturnValue({});
      mockUsersRepo.save.mockResolvedValue({});

      await service.createSocialUser(userData);

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: 'https://example.com/photo.jpg' }),
      );
    });
  });

  describe('session CRUD', () => {
    it('createSession should create and save session', async () => {
      const sessionData = {
        userId: 'u1',
        refreshToken: 'rt',
        expiresAt: new Date(),
      };
      const saved = { id: 's1', ...sessionData };
      mockSessionsRepo.create.mockReturnValue(saved);
      mockSessionsRepo.save.mockResolvedValue(saved);

      const result = await service.createSession(sessionData);

      expect(mockSessionsRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        refreshToken: 'rt',
        expiresAt: sessionData.expiresAt,
        deviceInfo: undefined,
      });
      expect(result).toEqual(saved);
    });

    it('findSessionById should find session', async () => {
      const session = { id: 's1' };
      mockSessionsRepo.findOne.mockResolvedValue(session);

      const result = await service.findSessionById('s1');

      expect(result).toEqual(session);
    });

    it('updateSessionToken should update token and expiry', async () => {
      const expiry = new Date();
      await service.updateSessionToken('s1', 'new-hash', expiry);

      expect(mockSessionsRepo.update).toHaveBeenCalledWith('s1', {
        refreshToken: 'new-hash',
        expiresAt: expiry,
      });
    });

    it('deleteSession should delete by id', async () => {
      await service.deleteSession('s1');

      expect(mockSessionsRepo.delete).toHaveBeenCalledWith('s1');
    });

    it('deleteAllUserSessions should delete by userId', async () => {
      await service.deleteAllUserSessions('u1');

      expect(mockSessionsRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
    });
  });

  describe('getProfile', () => {
    it('should return profile without passwordHash', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'secret-hash',
        firstName: 'Test',
        lastName: null,
        onboardingComplete: false,
      });

      const result = await service.getProfile('u1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'a@b.com');
      expect(result).toHaveProperty('firstName', 'Test');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should update dietary profile, goals, and set onboardingComplete', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });

      const dto = {
        dietaryProfile: {
          diets: [DietaryPreference.Vegan],
          excludedIngredients: ['Peanuts'],
          householdSize: 2,
          cookingSkill: CookingSkill.Intermediate,
        },
        nutritionalGoals: {
          goalType: GoalType.Maintain,
          dailyCalories: 2000,
          dailyProteinGrams: 150,
          dailyCarbsGrams: 250,
          dailyFatGrams: 65,
        },
      };

      const result = await service.completeOnboarding('u1', dto);

      expect(mockUsersRepo.update).toHaveBeenCalledWith('u1', {
        dietaryProfile: dto.dietaryProfile,
        nutritionalGoals: dto.nutritionalGoals,
        onboardingComplete: true,
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteAccount', () => {
    it('should delete all sessions then delete user and return appleRefreshToken', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        appleRefreshToken: 'apple-rt',
      });
      mockSessionsRepo.delete.mockResolvedValue({ affected: 2 });
      mockUsersRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteAccount('u1');

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(mockSessionsRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
      expect(mockUsersRepo.delete).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ success: true, appleRefreshToken: 'apple-rt' });
    });

    it('should return null appleRefreshToken for non-Apple users', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        appleRefreshToken: null,
      });
      mockSessionsRepo.delete.mockResolvedValue({ affected: 0 });
      mockUsersRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteAccount('u1');

      expect(result).toEqual({ success: true, appleRefreshToken: null });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('nope')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSessionsRepo.delete).not.toHaveBeenCalled();
      expect(mockUsersRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const dietaryProfile = {
      diets: [DietaryPreference.Keto],
      excludedIngredients: ['Shellfish'],
      householdSize: 3,
      cookingSkill: CookingSkill.Advanced,
    };

    const nutritionalGoals = {
      goalType: GoalType.BuildMuscle,
      dailyCalories: 2500,
      dailyProteinGrams: 200,
      dailyCarbsGrams: 300,
      dailyFatGrams: 75,
    };

    it('should update only dietaryProfile when only that is provided', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'h',
        firstName: 'Test',
        dietaryProfile,
      });

      const result = await service.updateProfile('u1', { dietaryProfile });

      expect(mockUsersRepo.update).toHaveBeenCalledWith('u1', { dietaryProfile });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update only nutritionalGoals when only that is provided', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'h',
        firstName: 'Test',
        nutritionalGoals,
      });

      const result = await service.updateProfile('u1', { nutritionalGoals });

      expect(mockUsersRepo.update).toHaveBeenCalledWith('u1', { nutritionalGoals });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update both fields when both are provided', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'h',
        firstName: 'Test',
        dietaryProfile,
        nutritionalGoals,
      });

      const result = await service.updateProfile('u1', {
        dietaryProfile,
        nutritionalGoals,
      });

      expect(mockUsersRepo.update).toHaveBeenCalledWith('u1', {
        dietaryProfile,
        nutritionalGoals,
      });
      expect(result).toHaveProperty('email', 'a@b.com');
    });

    it('should not touch onboardingComplete', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'h',
        firstName: 'Test',
        dietaryProfile,
      });

      await service.updateProfile('u1', { dietaryProfile });

      const updateArg = mockUsersRepo.update.mock.calls[0][1];
      expect(updateArg).not.toHaveProperty('onboardingComplete');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepo.update.mockResolvedValue({ affected: 1 });
      mockUsersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nope', { dietaryProfile }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
