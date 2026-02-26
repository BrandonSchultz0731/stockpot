import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { Difficulty } from '@shared/enums';

export class SwapMealPlanEntryDto {
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
