import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { MealType, Difficulty } from '@shared/enums';

class MealScheduleSlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsEnum(MealType)
  mealType: MealType;
}

export class GenerateMealPlanDto {
  @IsString()
  weekStartDate: string;

  @IsOptional()
  @IsArray()
  @IsEnum(MealType, { each: true })
  mealTypes?: MealType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealScheduleSlotDto)
  mealSchedule?: MealScheduleSlotDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  servingsPerMeal?: number;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryFlags?: string[];
}
