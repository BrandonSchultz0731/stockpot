import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { MealType } from '@shared/enums';
import type {
  RecipeIngredient,
  RecipeStep,
  RecipeNutrition,
} from '@shared/enums';

export class CreateRecipeDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cookTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsArray()
  ingredients: RecipeIngredient[];

  @IsArray()
  steps: RecipeStep[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryFlags?: string[];

  @IsOptional()
  @IsObject()
  nutrition?: RecipeNutrition;
}
