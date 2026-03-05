import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { PantryItem } from '../pantry/entities/pantry-item.entity';
import { MealPlan } from '../meal-plans/entities/meal-plan.entity';
import { MealPlanEntry } from '../meal-plans/entities/meal-plan-entry.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsCronService } from './notifications-cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      User,
      UserSession,
      PantryItem,
      MealPlan,
      MealPlanEntry,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsCronService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
