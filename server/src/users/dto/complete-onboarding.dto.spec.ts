import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CompleteOnboardingDto,
  DietaryProfileDto,
  NutritionalGoalsDto,
} from './complete-onboarding.dto';
import {
  DietaryPreference,
  GoalType,
  CookingSkill,
} from '@shared/enums';

function createDto(data: any): CompleteOnboardingDto {
  return plainToInstance(CompleteOnboardingDto, data);
}

const validData = {
  dietaryProfile: {
    diets: [DietaryPreference.Vegan],
    excludedIngredients: ['Peanuts'],
    householdSize: 2,
    cookingSkill: CookingSkill.Intermediate,
  },
  nutritionalGoals: {
    goalType: GoalType.Maintain,
    dailyCalories: 2000,
    dailyProteinGrams: 150,
    dailyCarbsGrams: 250,
    dailyFatGrams: 65,
  },
};

describe('CompleteOnboardingDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = createDto(validData);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid diet enum value', async () => {
    const dto = createDto({
      ...validData,
      dietaryProfile: {
        ...validData.dietaryProfile,
        diets: ['InvalidDiet'],
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid cooking skill enum', async () => {
    const dto = createDto({
      ...validData,
      dietaryProfile: {
        ...validData.dietaryProfile,
        cookingSkill: 'Expert',
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with householdSize less than 1', async () => {
    const dto = createDto({
      ...validData,
      dietaryProfile: {
        ...validData.dietaryProfile,
        householdSize: 0,
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with householdSize greater than 10', async () => {
    const dto = createDto({
      ...validData,
      dietaryProfile: {
        ...validData.dietaryProfile,
        householdSize: 11,
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid goal type', async () => {
    const dto = createDto({
      ...validData,
      nutritionalGoals: {
        ...validData.nutritionalGoals,
        goalType: 'BulkUp',
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative calorie value', async () => {
    const dto = createDto({
      ...validData,
      nutritionalGoals: {
        ...validData.nutritionalGoals,
        dailyCalories: -100,
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative protein value', async () => {
    const dto = createDto({
      ...validData,
      nutritionalGoals: {
        ...validData.nutritionalGoals,
        dailyProteinGrams: -1,
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass with zero macros (edge case)', async () => {
    const dto = createDto({
      ...validData,
      nutritionalGoals: {
        goalType: GoalType.LoseWeight,
        dailyCalories: 0,
        dailyProteinGrams: 0,
        dailyCarbsGrams: 0,
        dailyFatGrams: 0,
      },
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
