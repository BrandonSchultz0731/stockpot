import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
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

  @IsOptional()
  @IsString()
  imageBase64?: string;

  @IsOptional()
  @IsIn(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
  mimeType?: string;
}
