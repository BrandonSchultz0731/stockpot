import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AddLeftoverEntryDto } from './add-leftover-entry.dto';
import { MealType } from '@shared/enums';

function createDto(data: Record<string, unknown>): AddLeftoverEntryDto {
  return plainToInstance(AddLeftoverEntryDto, data);
}

describe('AddLeftoverEntryDto', () => {
  const validData: Record<string, unknown> = {
    mealPlanId: '550e8400-e29b-41d4-a716-446655440000',
    sourceEntryId: '550e8400-e29b-41d4-a716-446655440001',
    dayOfWeek: 2,
    mealType: MealType.Dinner,
    servings: 2,
  };

  it('should pass validation with valid data', async () => {
    const dto = createDto(validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with missing mealPlanId', async () => {
    const dto = createDto({ ...validData, mealPlanId: undefined });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'mealPlanId')).toBeDefined();
  });

  it('should fail with invalid mealPlanId', async () => {
    const dto = createDto({ ...validData, mealPlanId: 'not-a-uuid' });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'mealPlanId')).toBeDefined();
  });

  it('should fail with missing sourceEntryId', async () => {
    const dto = createDto({ ...validData, sourceEntryId: undefined });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'sourceEntryId')).toBeDefined();
  });

  it('should fail with dayOfWeek out of range', async () => {
    const dto = createDto({ ...validData, dayOfWeek: 7 });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'dayOfWeek')).toBeDefined();
  });

  it('should fail with negative dayOfWeek', async () => {
    const dto = createDto({ ...validData, dayOfWeek: -1 });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'dayOfWeek')).toBeDefined();
  });

  it('should fail with servings less than 1', async () => {
    const dto = createDto({ ...validData, servings: 0 });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'servings')).toBeDefined();
  });

  it('should fail with missing servings', async () => {
    const dto = createDto({ ...validData, servings: undefined });
    const errors = await validate(dto);
    expect(errors.find((e) => e.property === 'servings')).toBeDefined();
  });
});
