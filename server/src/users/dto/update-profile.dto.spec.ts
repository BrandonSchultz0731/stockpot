import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from './update-profile.dto';
import {
  DietaryPreference,
  GoalType,
  CookingSkill,
} from '@shared/enums';

function createDto(data: any): UpdateProfileDto {
  return plainToInstance(UpdateProfileDto, data);
}

const validDietaryProfile = {
  diets: [DietaryPreference.Vegan],
  excludedIngredients: ['Peanuts'],
  householdSize: 2,
  cookingSkill: CookingSkill.Intermediate,
};

const validNutritionalGoals = {
  goalType: GoalType.Maintain,
  dailyCalories: 2000,
  dailyProteinGrams: 150,
  dailyCarbsGrams: 250,
  dailyFatGrams: 65,
};

describe('UpdateProfileDto', () => {
  it('should pass with both fields provided', async () => {
    const dto = createDto({
      dietaryProfile: validDietaryProfile,
      nutritionalGoals: validNutritionalGoals,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only dietaryProfile', async () => {
    const dto = createDto({
      dietaryProfile: validDietaryProfile,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with only nutritionalGoals', async () => {
    const dto = createDto({
      nutritionalGoals: validNutritionalGoals,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with empty body (no fields)', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid diet enum in dietaryProfile', async () => {
    const dto = createDto({
      dietaryProfile: {
        ...validDietaryProfile,
        diets: ['InvalidDiet'],
      },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with invalid goalType in nutritionalGoals', async () => {
    const dto = createDto({
      nutritionalGoals: {
        ...validNutritionalGoals,
        goalType: 'BulkUp',
      },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with negative calorie value', async () => {
    const dto = createDto({
      nutritionalGoals: {
        ...validNutritionalGoals,
        dailyCalories: -100,
      },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with householdSize out of range', async () => {
    const dto = createDto({
      dietaryProfile: {
        ...validDietaryProfile,
        householdSize: 11,
      },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
