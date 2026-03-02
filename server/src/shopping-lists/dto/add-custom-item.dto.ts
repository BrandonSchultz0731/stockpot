import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddCustomItemDto {
  @IsString()
  displayName: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  category?: string;
}
