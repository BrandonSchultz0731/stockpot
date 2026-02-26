import { IsOptional, IsBoolean, IsInt, IsString, Min, Max } from 'class-validator';

export class SaveRecipeDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  customServings?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
