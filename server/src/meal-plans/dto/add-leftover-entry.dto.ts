import { IsUUID, IsInt, IsString, Min, Max } from 'class-validator';
import { MealType } from '@shared/enums';

export class AddLeftoverEntryDto {
  @IsUUID()
  mealPlanId: string;

  @IsUUID()
  sourceEntryId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  mealType: MealType;

  @IsInt()
  @Min(1)
  servings: number;
}
