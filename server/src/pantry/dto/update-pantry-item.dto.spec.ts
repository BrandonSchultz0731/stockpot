import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePantryItemDto } from './update-pantry-item.dto';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

function createDto(data: any): UpdatePantryItemDto {
  return plainToInstance(UpdatePantryItemDto, data);
}

describe('UpdatePantryItemDto', () => {
  it('should pass validation with empty object (all fields optional)', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid displayName', async () => {
    const dto = createDto({ displayName: 'Updated Name' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid quantity', async () => {
    const dto = createDto({ quantity: 5 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with negative quantity', async () => {
    const dto = createDto({ quantity: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with zero quantity', async () => {
    const dto = createDto({ quantity: 0 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid storageLocation', async () => {
    const dto = createDto({ storageLocation: StorageLocation.Freezer });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid storageLocation', async () => {
    const dto = createDto({ storageLocation: 'Garage' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with valid expirationDate', async () => {
    const dto = createDto({ expirationDate: '2026-12-31' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid expirationDate format', async () => {
    const dto = createDto({ expirationDate: 'tomorrow' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with boolean expiryIsEstimated', async () => {
    const dto = createDto({ expiryIsEstimated: false });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with non-boolean expiryIsEstimated', async () => {
    const dto = createDto({ expiryIsEstimated: 'no' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with boolean opened', async () => {
    const dto = createDto({ opened: true });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with non-boolean opened', async () => {
    const dto = createDto({ opened: 1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with valid unit enum value', async () => {
    const dto = createDto({ unit: UnitOfMeasure.Cup });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid unit enum value', async () => {
    const dto = createDto({ unit: 'lbs' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with valid notes', async () => {
    const dto = createDto({ notes: 'Half used, freeze the rest' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with multiple fields updated at once', async () => {
    const dto = createDto({
      displayName: 'Updated Chicken',
      quantity: 1.5,
      unit: UnitOfMeasure.Kg,
      storageLocation: StorageLocation.Freezer,
      expirationDate: '2026-06-15',
      expiryIsEstimated: false,
      opened: true,
      notes: 'Moved to freezer',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
