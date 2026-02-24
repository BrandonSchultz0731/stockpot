import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

@ValidatorConstraint({ name: 'hasFoodReference', async: false })
class HasFoodReferenceConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as CreatePantryItemDto;
    return !!(obj.foodCacheId || obj.fdcId);
  }

  defaultMessage() {
    return 'Either foodCacheId or fdcId must be provided';
  }
}

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

  @Validate(HasFoodReferenceConstraint)
  private readonly _validateFoodRef?: boolean;
}
