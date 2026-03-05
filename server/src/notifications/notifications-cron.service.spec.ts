import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsCronService } from './notifications-cron.service';
import { NotificationsService } from './notifications.service';
import { DEFAULT_NOTIFICATION_PREFS, NotificationType } from '@shared/enums';
import { PantryItem } from '../pantry/entities/pantry-item.entity';
import { MealPlan } from '../meal-plans/entities/meal-plan.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { User } from '../users/entities/user.entity';

const mockPantryItemsRepo = {
  createQueryBuilder: jest.fn(),
};

const mockMealPlansRepo = {
  findOne: jest.fn(),
};

const mockMealPlanEntriesRepo = {
  createQueryBuilder: jest.fn(),
};

const mockUsersRepo = {
  findOne: jest.fn(),
};

const mockNotificationsService = {
  getTokensForUser: jest.fn(),
  getUsersWithTokens: jest.fn(),
  sendPush: jest.fn(),
};

function makePantryQb(items: { userId: string; displayName: string }[]) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(items),
  };
}

function makeEntriesQb(entries: Record<string, unknown>[]) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(entries),
  };
}

describe('NotificationsCronService', () => {
  let service: NotificationsCronService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsCronService,
        {
          provide: getRepositoryToken(PantryItem),
          useValue: mockPantryItemsRepo,
        },
        {
          provide: getRepositoryToken(MealPlan),
          useValue: mockMealPlansRepo,
        },
        {
          provide: getRepositoryToken(MealPlanEntry),
          useValue: mockMealPlanEntriesRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<NotificationsCronService>(NotificationsCronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleExpiringItems', () => {
    it('should send notification for single expiring item', async () => {
      mockPantryItemsRepo.createQueryBuilder.mockReturnValue(
        makePantryQb([{ userId: 'u1', displayName: 'Spinach' }]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockNotificationsService.getTokensForUser.mockResolvedValue([
        'token-1',
      ]);

      await service.handleExpiringItems();

      expect(mockNotificationsService.sendPush).toHaveBeenCalledWith(
        'token-1',
        'Expiring Soon',
        'Spinach expires tomorrow',
        { type: NotificationType.ExpiringItems },
      );
    });

    it('should send grouped notification for multiple expiring items', async () => {
      mockPantryItemsRepo.createQueryBuilder.mockReturnValue(
        makePantryQb([
          { userId: 'u1', displayName: 'Spinach' },
          { userId: 'u1', displayName: 'Milk' },
          { userId: 'u1', displayName: 'Yogurt' },
        ]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockNotificationsService.getTokensForUser.mockResolvedValue([
        'token-1',
      ]);

      await service.handleExpiringItems();

      expect(mockNotificationsService.sendPush).toHaveBeenCalledWith(
        'token-1',
        'Expiring Soon',
        'Spinach and 2 other items expire tomorrow',
        { type: NotificationType.ExpiringItems },
      );
    });

    it('should not send when user has expiringItems disabled', async () => {
      mockPantryItemsRepo.createQueryBuilder.mockReturnValue(
        makePantryQb([{ userId: 'u1', displayName: 'Spinach' }]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, expiringItems: false },
      });

      await service.handleExpiringItems();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });

    it('should not send when no items are expiring', async () => {
      mockPantryItemsRepo.createQueryBuilder.mockReturnValue(
        makePantryQb([]),
      );

      await service.handleExpiringItems();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });

    it('should not send when user has no push tokens', async () => {
      mockPantryItemsRepo.createQueryBuilder.mockReturnValue(
        makePantryQb([{ userId: 'u1', displayName: 'Spinach' }]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockNotificationsService.getTokensForUser.mockResolvedValue([]);

      await service.handleExpiringItems();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });
  });

  describe('handleDinnerReminder', () => {
    it('should send dinner reminder for uncooked entry', async () => {
      mockMealPlanEntriesRepo.createQueryBuilder.mockReturnValue(
        makeEntriesQb([
          {
            id: 'entry-1',
            mealPlan: { userId: 'u1' },
            recipe: { title: 'Thai Basil Chicken' },
          },
        ]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockNotificationsService.getTokensForUser.mockResolvedValue([
        'token-1',
      ]);

      await service.handleDinnerReminder();

      expect(mockNotificationsService.sendPush).toHaveBeenCalledWith(
        'token-1',
        "Tonight's Dinner",
        "Tonight's dinner: Thai Basil Chicken",
        { type: NotificationType.MealReminder },
      );
    });

    it('should not send when user has mealReminders disabled', async () => {
      mockMealPlanEntriesRepo.createQueryBuilder.mockReturnValue(
        makeEntriesQb([
          {
            id: 'entry-1',
            mealPlan: { userId: 'u1' },
            recipe: { title: 'Thai Basil Chicken' },
          },
        ]),
      );
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, mealReminders: false },
      });

      await service.handleDinnerReminder();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });

    it('should not send when no dinner entries exist', async () => {
      mockMealPlanEntriesRepo.createQueryBuilder.mockReturnValue(
        makeEntriesQb([]),
      );

      await service.handleDinnerReminder();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });
  });

  describe('handleMealPlanNudge', () => {
    it('should send nudge when user has no plan for next week', async () => {
      mockNotificationsService.getUsersWithTokens.mockResolvedValue(['u1']);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockMealPlansRepo.findOne.mockResolvedValue(null);
      mockNotificationsService.getTokensForUser.mockResolvedValue([
        'token-1',
      ]);

      await service.handleMealPlanNudge();

      expect(mockNotificationsService.sendPush).toHaveBeenCalledWith(
        'token-1',
        'Meal Plan Reminder',
        "You haven't created a meal plan for next week yet",
        { type: NotificationType.MealPlanNudge },
      );
    });

    it('should not send when user already has a plan', async () => {
      mockNotificationsService.getUsersWithTokens.mockResolvedValue(['u1']);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      });
      mockMealPlansRepo.findOne.mockResolvedValue({ id: 'plan-1' });

      await service.handleMealPlanNudge();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });

    it('should not send when user has mealPlanNudge disabled', async () => {
      mockNotificationsService.getUsersWithTokens.mockResolvedValue(['u1']);
      mockUsersRepo.findOne.mockResolvedValue({
        id: 'u1',
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, mealPlanNudge: false },
      });

      await service.handleMealPlanNudge();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
      expect(mockMealPlansRepo.findOne).not.toHaveBeenCalled();
    });

    it('should not send when no users have tokens', async () => {
      mockNotificationsService.getUsersWithTokens.mockResolvedValue([]);

      await service.handleMealPlanNudge();

      expect(mockNotificationsService.sendPush).not.toHaveBeenCalled();
    });
  });
});
