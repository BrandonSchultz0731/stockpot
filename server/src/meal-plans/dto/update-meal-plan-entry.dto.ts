import { IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class UpdateMealPlanEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isCooked?: boolean;
}
