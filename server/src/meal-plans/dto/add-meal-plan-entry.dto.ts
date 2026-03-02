import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { MealType } from '@shared/enums';

export class AddMealPlanEntryDto {
  @IsString()
  mealPlanId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsEnum(MealType)
  mealType: MealType;

  @IsOptional()
  @IsUrl()
  url?: string;
}
