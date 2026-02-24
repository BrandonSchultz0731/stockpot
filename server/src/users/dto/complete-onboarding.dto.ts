import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DietaryPreference,
  GoalType,
  CookingSkill,
} from '@shared/enums';

export class DietaryProfileDto {
  @IsArray()
  @IsEnum(DietaryPreference, { each: true })
  diets: DietaryPreference[];

  @IsArray()
  @IsString({ each: true })
  excludedIngredients: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  householdSize: number;

  @IsEnum(CookingSkill)
  cookingSkill: CookingSkill;
}

export class NutritionalGoalsDto {
  @IsEnum(GoalType)
  goalType: GoalType;

  @IsNumber()
  @Min(0)
  dailyCalories: number;

  @IsNumber()
  @Min(0)
  dailyProteinGrams: number;

  @IsNumber()
  @Min(0)
  dailyCarbsGrams: number;

  @IsNumber()
  @Min(0)
  dailyFatGrams: number;
}

export class CompleteOnboardingDto {
  @ValidateNested()
  @Type(() => DietaryProfileDto)
  dietaryProfile: DietaryProfileDto;

  @ValidateNested()
  @Type(() => NutritionalGoalsDto)
  nutritionalGoals: NutritionalGoalsDto;
}
