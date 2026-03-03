import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class DeductionItemDto {
  @IsString()
  pantryItemId: string;

  @IsNumber()
  @Min(0)
  deductQuantity: number;

  @IsString()
  deductUnit: string;
}

export class ConfirmCookDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeductionItemDto)
  deductions: DeductionItemDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  servingsToCook?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servingsToEat?: number;
}
