import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePantryItemDto } from './create-pantry-item.dto';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

function createDto(data: any): CreatePantryItemDto {
  return plainToInstance(CreatePantryItemDto, data);
}

const validWithFoodCacheId = {
  foodCacheId: '550e8400-e29b-41d4-a716-446655440000',
  displayName: 'Chicken Breast',
  quantity: 2,
  unit: UnitOfMeasure.Lb,
};

const validWithFdcId = {
  fdcId: 171077,
  displayName: 'Chicken Breast',
  quantity: 2,
  unit: UnitOfMeasure.Lb,
};

describe('CreatePantryItemDto', () => {
  it('should pass validation with foodCacheId', async () => {
    const dto = createDto(validWithFoodCacheId);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with fdcId', async () => {
    const dto = createDto(validWithFdcId);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with all optional fields provided', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      storageLocation: StorageLocation.Fridge,
      expirationDate: '2026-03-15',
      expiryIsEstimated: false,
      opened: true,
      notes: 'Bought at Costco',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid unit enum value', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      unit: 'lbs',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with all valid UnitOfMeasure values', async () => {
    for (const unit of Object.values(UnitOfMeasure)) {
      const dto = createDto({
        ...validWithFoodCacheId,
        unit,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should fail when neither foodCacheId nor fdcId is provided', async () => {
    const dto = createDto({
      displayName: 'Chicken',
      quantity: 2,
      unit: UnitOfMeasure.Lb,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
    expect(messages.some((m) => m.includes('foodCacheId or fdcId'))).toBe(true);
  });

  it('should fail with invalid UUID for foodCacheId', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      foodCacheId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when displayName is missing', async () => {
    const dto = createDto({
      foodCacheId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2,
      unit: UnitOfMeasure.Lb,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when quantity is missing', async () => {
    const dto = createDto({
      foodCacheId: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Chicken',
      unit: UnitOfMeasure.Lb,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative quantity', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      quantity: -1,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with zero quantity', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      quantity: 0,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when unit is missing', async () => {
    const dto = createDto({
      foodCacheId: '550e8400-e29b-41d4-a716-446655440000',
      displayName: 'Chicken',
      quantity: 2,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid storageLocation enum value', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      storageLocation: 'Garage',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with all valid StorageLocation values', async () => {
    for (const location of Object.values(StorageLocation)) {
      const dto = createDto({
        ...validWithFoodCacheId,
        storageLocation: location,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should fail with invalid date format for expirationDate', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      expirationDate: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-boolean expiryIsEstimated', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      expiryIsEstimated: 'yes',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-boolean opened', async () => {
    const dto = createDto({
      ...validWithFoodCacheId,
      opened: 'yes',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
