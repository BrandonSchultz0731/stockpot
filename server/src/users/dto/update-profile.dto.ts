import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DietaryProfileDto, NutritionalGoalsDto } from './complete-onboarding.dto';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DietaryProfileDto)
  dietaryProfile?: DietaryProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionalGoalsDto)
  nutritionalGoals?: NutritionalGoalsDto;
}
