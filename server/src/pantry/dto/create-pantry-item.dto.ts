import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

export class CreatePantryItemDto {
  @IsOptional()
  @IsUUID()
  foodCacheId?: string;

  @IsOptional()
  @IsNumber()
  fdcId?: number;

  @IsString()
  displayName: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;

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
