import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { MealType, Difficulty } from '@shared/enums';

export class GenerateMealPlanDto {
  @IsString()
  weekStartDate: string;

  @IsOptional()
  @IsArray()
  @IsEnum(MealType, { each: true })
  mealTypes?: MealType[];

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
