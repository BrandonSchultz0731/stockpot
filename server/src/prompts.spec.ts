import { buildPhotoRecipeImportPrompt, buildSkillBlock, buildRecipeGenerationPrompt, buildMealPlanPrompt, buildMealSwapPrompt } from './prompts';
import { CookingSkill, MealType } from '@shared/enums';

describe('buildSkillBlock', () => {
  it('should return beginner guidance for Beginner skill', () => {
    const result = buildSkillBlock(CookingSkill.Beginner);
    expect(result).toContain('Beginner');
    expect(result).toContain('straightforward techniques');
  });

  it('should return intermediate guidance for Intermediate skill', () => {
    const result = buildSkillBlock(CookingSkill.Intermediate);
    expect(result).toContain('Intermediate');
    expect(result).toContain('compound flavors');
  });

  it('should return advanced guidance for Advanced skill', () => {
    const result = buildSkillBlock(CookingSkill.Advanced);
    expect(result).toContain('Advanced');
    expect(result).toContain('multi-step techniques');
  });

  it('should return empty string when skill is undefined', () => {
    expect(buildSkillBlock(undefined)).toBe('');
  });

  it('should return empty string for unknown skill value', () => {
    expect(buildSkillBlock('Unknown')).toBe('');
  });
});

describe('flavor guidance in prompts', () => {
  it('should include flavor guidance in recipe generation prompt', () => {
    const prompt = buildRecipeGenerationPrompt('Chicken Breast', 3, '');
    expect(prompt).toContain('FLAVOR & TASTE GUIDELINES');
    expect(prompt).toContain('salt, acid, fat, heat, and umami');
    expect(prompt).toContain('finishing element');
  });

  it('should include flavor guidance in meal plan prompt', () => {
    const prompt = buildMealPlanPrompt('Chicken Breast', [{ dayOfWeek: 1, mealType: MealType.Dinner }], 2, '');
    expect(prompt).toContain('FLAVOR & TASTE GUIDELINES');
    expect(prompt).toContain('Vary cuisines, protein sources');
  });

  it('should include flavor guidance in meal swap prompt', () => {
    const prompt = buildMealSwapPrompt('Chicken Breast', 'Monday', 'Dinner', 'Old Recipe', '');
    expect(prompt).toContain('FLAVOR & TASTE GUIDELINES');
  });

  it('should describe recipe generation chef as flavor-focused', () => {
    const prompt = buildRecipeGenerationPrompt('Chicken Breast', 3, '');
    expect(prompt).toContain('flavor-focused chef');
  });
});

describe('buildPhotoRecipeImportPrompt', () => {
  it('should include the mealType in the prompt', () => {
    const prompt = buildPhotoRecipeImportPrompt('Dinner');
    expect(prompt).toContain('"Dinner"');
  });

  it('should include the expected JSON fields', () => {
    const prompt = buildPhotoRecipeImportPrompt('Lunch');
    expect(prompt).toContain('"title"');
    expect(prompt).toContain('"ingredients"');
    expect(prompt).toContain('"steps"');
    expect(prompt).toContain('"nutrition"');
    expect(prompt).toContain('"baseQuantity"');
    expect(prompt).toContain('"baseUnit"');
  });

  it('should include error handling instruction', () => {
    const prompt = buildPhotoRecipeImportPrompt('Breakfast');
    expect(prompt).toContain('"error"');
    expect(prompt).toContain('does not contain a recipe');
  });

  it('should include ingredient naming instruction', () => {
    const prompt = buildPhotoRecipeImportPrompt('Snack');
    expect(prompt).toContain('simple, consistent ingredient names');
  });

  it('should mention physical recipe sources', () => {
    const prompt = buildPhotoRecipeImportPrompt('Dinner');
    expect(prompt).toContain('cookbook');
    expect(prompt).toContain('recipe card');
    expect(prompt).toContain('handwritten');
  });
});
