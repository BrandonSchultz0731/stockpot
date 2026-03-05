import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { DEFAULT_NOTIFICATION_PREFS } from '@shared/enums';

const mockQb = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  setParameter: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
};

const mockUsersRepo = {
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

const mockSessionsRepo = {
  find: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(undefined),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(UserSession), useValue: mockSessionsRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPushToken', () => {
    it('should update all non-expired sessions for the user', async () => {
      mockSessionsRepo.update.mockResolvedValue({ affected: 2 });

      const result = await service.registerPushToken('user-1', {
        pushToken: 'fcm-token-abc',
        pushPlatform: 'ios',
      });

      expect(result).toEqual({ success: true });
      expect(mockSessionsRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        { pushToken: 'fcm-token-abc', pushPlatform: 'ios' },
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update and return merged preferences', async () => {
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'user-1',
        notificationPrefs: null,
      });
      const result = await service.updatePreferences('user-1', {
        mealReminders: false,
      });

      expect(result).toEqual({
        ...DEFAULT_NOTIFICATION_PREFS,
        mealReminders: false,
      });
      expect(mockUsersRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQb.execute).toHaveBeenCalled();
    });
  });

  describe('getTokensForUser', () => {
    it('should return unique tokens for user', async () => {
      mockSessionsRepo.find.mockResolvedValue([
        { pushToken: 'token-a' },
        { pushToken: 'token-b' },
        { pushToken: 'token-a' },
      ]);

      const result = await service.getTokensForUser('user-1');

      expect(result).toEqual(['token-a', 'token-b']);
    });

    it('should return empty array when user has no tokens', async () => {
      mockSessionsRepo.find.mockResolvedValue([]);

      const result = await service.getTokensForUser('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUsersWithTokens', () => {
    it('should return distinct user IDs', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { userId: 'user-1' },
          { userId: 'user-2' },
        ]),
      };
      mockSessionsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUsersWithTokens();

      expect(result).toEqual(['user-1', 'user-2']);
    });
  });

  describe('sendPush', () => {
    it('should log warning when firebase is not initialized', async () => {
      const logSpy = jest.spyOn(service['logger'], 'warn');

      await service.sendPush('token', 'Title', 'Body');

      expect(logSpy).toHaveBeenCalledWith(
        'Firebase not initialized — skipping push send',
      );
    });
  });
});
