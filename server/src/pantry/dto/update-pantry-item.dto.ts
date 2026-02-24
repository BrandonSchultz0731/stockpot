import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

export class UpdatePantryItemDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(UnitOfMeasure)
  unit?: UnitOfMeasure;

  @IsOptional()
  @IsEnum(StorageLocation)
  storageLocation?: StorageLocation;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsBoolean()
  expiryIsEstimated?: boolean;

  @IsOptional()
  @IsBoolean()
  opened?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
