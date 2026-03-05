import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class UpdateNotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  expiringItems?: boolean;

  @IsOptional()
  @IsBoolean()
  mealReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  mealPlanNudge?: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'mealReminderTime must be in HH:mm 24-hour format',
  })
  mealReminderTime?: string;
}
