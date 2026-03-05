import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, Not } from 'typeorm';
import { PantryItem } from '../pantry/entities/pantry-item.entity';
import { MealPlan } from '../meal-plans/entities/meal-plan.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import type { NotificationPrefs } from '@shared/enums';
import { DEFAULT_NOTIFICATION_PREFS, MealType, NotificationType } from '@shared/enums';

@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);

  constructor(
    @InjectRepository(PantryItem)
    private readonly pantryItemsRepo: Repository<PantryItem>,
    @InjectRepository(MealPlan)
    private readonly mealPlansRepo: Repository<MealPlan>,
    @InjectRepository(MealPlanEntry)
    private readonly mealPlanEntriesRepo: Repository<MealPlanEntry>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getUserPrefs(user: User): NotificationPrefs {
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...(user.notificationPrefs as Partial<NotificationPrefs>),
    };
  }

  // 9 AM ET = 14:00 UTC
  @Cron('0 14 * * *')
  async handleExpiringItems(): Promise<void> {
    this.logger.log('Running expiring items notification job');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const expiringItems = await this.pantryItemsRepo
      .createQueryBuilder('pi')
      .select(['pi.userId', 'pi.displayName'])
      .where('pi.expirationDate = :date', { date: tomorrowStr })
      .getMany();

    if (expiringItems.length === 0) return;

    // Group by userId
    const byUser = new Map<string, string[]>();
    for (const item of expiringItems) {
      const names = byUser.get(item.userId) ?? [];
      names.push(item.displayName);
      byUser.set(item.userId, names);
    }

    for (const [userId, itemNames] of byUser) {
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (!user) continue;

      const prefs = this.getUserPrefs(user);
      if (!prefs.expiringItems) continue;

      const tokens = await this.notificationsService.getTokensForUser(userId);
      if (tokens.length === 0) continue;

      const body =
        itemNames.length === 1
          ? `${itemNames[0]} expires tomorrow`
          : `${itemNames[0]} and ${itemNames.length - 1} other item${itemNames.length - 1 > 1 ? 's' : ''} expire tomorrow`;

      for (const token of tokens) {
        await this.notificationsService.sendPush(
          token,
          'Expiring Soon',
          body,
          { type: NotificationType.ExpiringItems },
        );
      }
    }
  }

  // 5 PM ET = 22:00 UTC
  @Cron('0 22 * * *')
  async handleDinnerReminder(): Promise<void> {
    this.logger.log('Running dinner reminder notification job');

    const today = new Date();
    const dayOfWeek = today.getUTCDay();

    // Get the current week's Monday (weekStartDate)
    const mondayOffset = today.getUTCDay() === 0 ? -6 : 1 - today.getUTCDay();
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + mondayOffset);
    const weekStartDate = monday.toISOString().split('T')[0];

    const entries = await this.mealPlanEntriesRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.mealPlan', 'mp')
      .innerJoinAndSelect('e.recipe', 'r')
      .where('mp.weekStartDate = :weekStartDate', { weekStartDate })
      .andWhere('e.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('e.mealType = :mealType', { mealType: MealType.Dinner })
      .andWhere('e.isCooked = false')
      .andWhere('e.leftoverSourceEntryId IS NULL')
      .getMany();

    for (const entry of entries) {
      const userId = entry.mealPlan.userId;
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (!user) continue;

      const prefs = this.getUserPrefs(user);
      if (!prefs.mealReminders) continue;

      const tokens = await this.notificationsService.getTokensForUser(userId);
      if (tokens.length === 0) continue;

      for (const token of tokens) {
        await this.notificationsService.sendPush(
          token,
          "Tonight's Dinner",
          `Tonight's dinner: ${entry.recipe.title}`,
          { type: NotificationType.MealReminder },
        );
      }
    }
  }

  // Saturday 10 AM ET = 15:00 UTC
  @Cron('0 15 * * 6')
  async handleMealPlanNudge(): Promise<void> {
    this.logger.log('Running meal plan nudge notification job');

    // Next week's Monday
    const today = new Date();
    const daysUntilNextMonday = ((1 - today.getUTCDay() + 7) % 7) || 7;
    const nextMonday = new Date(today);
    nextMonday.setUTCDate(today.getUTCDate() + daysUntilNextMonday);
    const nextWeekStart = nextMonday.toISOString().split('T')[0];

    // Find all users with push tokens
    const usersWithTokens = await this.notificationsService.getUsersWithTokens();

    for (const userId of usersWithTokens) {
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (!user) continue;

      const prefs = this.getUserPrefs(user);
      if (!prefs.mealPlanNudge) continue;

      // Check if they already have a meal plan for next week
      const existingPlan = await this.mealPlansRepo.findOne({
        where: { userId, weekStartDate: nextWeekStart },
      });
      if (existingPlan) continue;

      const tokens = await this.notificationsService.getTokensForUser(userId);
      for (const token of tokens) {
        await this.notificationsService.sendPush(
          token,
          'Meal Plan Reminder',
          "You haven't created a meal plan for next week yet",
          { type: NotificationType.MealPlanNudge },
        );
      }
    }
  }
}
