import { buildPhotoRecipeImportPrompt } from './prompts';

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
