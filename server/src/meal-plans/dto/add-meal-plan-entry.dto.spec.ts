import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AddMealPlanEntryDto } from './add-meal-plan-entry.dto';

function createDto(data: any): AddMealPlanEntryDto {
  return plainToInstance(AddMealPlanEntryDto, data);
}

describe('AddMealPlanEntryDto', () => {
  it('should pass with valid required fields (AI generation)', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 3,
      mealType: 'Breakfast',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid fields including url (website import)', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 0,
      mealType: 'Dinner',
      url: 'https://example.com/recipe',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with dayOfWeek 0 (Sunday)', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 0,
      mealType: 'Lunch',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with dayOfWeek 6 (Saturday)', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 6,
      mealType: 'Snack',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when mealPlanId is missing', async () => {
    const dto = createDto({
      dayOfWeek: 1,
      mealType: 'Breakfast',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when dayOfWeek is missing', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      mealType: 'Breakfast',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when mealType is missing', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when dayOfWeek is negative', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: -1,
      mealType: 'Breakfast',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when dayOfWeek is greater than 6', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 7,
      mealType: 'Breakfast',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when mealType is invalid', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
      mealType: 'Brunch',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when url is not a valid URL', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
      mealType: 'Dinner',
      url: 'not-a-url',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass when url is omitted', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 2,
      mealType: 'Lunch',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with valid imageBase64 and mimeType (photo import)', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
      mealType: 'Dinner',
      imageBase64: 'iVBORw0KGgoAAAANS...',
      mimeType: 'image/jpeg',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ])('should pass with mimeType %s', async (mimeType) => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 0,
      mealType: 'Breakfast',
      imageBase64: 'base64data',
      mimeType,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when mimeType is not an allowed value', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 1,
      mealType: 'Lunch',
      imageBase64: 'base64data',
      mimeType: 'image/bmp',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass when imageBase64 and mimeType are omitted', async () => {
    const dto = createDto({
      mealPlanId: 'plan-1',
      dayOfWeek: 3,
      mealType: 'Dinner',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
