import {
  Injectable,
  Logger,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { SavedRecipe } from './entities/saved-recipe.entity';
import { PantryService } from '../pantry/pantry.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
import { SaveRecipeDto } from './dto/save-recipe.dto';
import { UpdateSavedRecipeDto } from './dto/update-saved-recipe.dto';
import { ACTIVE_MODEL } from '../ai-models';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(SavedRecipe)
    private readonly savedRecipeRepo: Repository<SavedRecipe>,
    private readonly pantryService: PantryService,
    private readonly anthropicService: AnthropicService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  async findById(recipeId: string): Promise<Recipe> {
    const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return recipe;
  }

  async generateRecipes(
    userId: string,
    dto: GenerateRecipeDto,
  ): Promise<Recipe[]> {
    const pantryItems = await this.pantryService.findAllForUser(userId);

    const ingredientList = pantryItems
      .map((item) => `${item.displayName} (${item.quantity} ${item.unit})`)
      .join('\n');

    const filters: string[] = [];
    if (dto.mealType) filters.push(`Meal type: ${dto.mealType}`);
    if (dto.cuisine) filters.push(`Cuisine: ${dto.cuisine}`);
    if (dto.difficulty) filters.push(`Difficulty: ${dto.difficulty}`);
    if (dto.maxCookTimeMinutes)
      filters.push(`Max cook time: ${dto.maxCookTimeMinutes} minutes`);
    if (dto.servings) filters.push(`Servings: ${dto.servings}`);
    if (dto.dietaryFlags?.length)
      filters.push(`Dietary requirements: ${dto.dietaryFlags.join(', ')}`);

    const numberOfRecipes = dto.numberOfRecipes ?? 3;
    const filterBlock =
      filters.length > 0
        ? `\nPreferences:\n${filters.join('\n')}\n`
        : '';

    const prompt = `You are a creative chef. Based on the following pantry ingredients, suggest ${numberOfRecipes} recipes that can be made primarily with these items. It's okay to include a few common ingredients not in the pantry.

Pantry ingredients:
${ingredientList}
${filterBlock}
Return ONLY a JSON array of ${numberOfRecipes} recipe objects with these fields:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "mealType": "Breakfast" | "Lunch" | "Dinner" | "Snack"
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional), "inPantry": boolean (true if the ingredient matches or is a variant of something in the pantry list above, false if it would need to be acquired separately — use fuzzy matching, e.g. "Baby Spinach" matches "Spinach") }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON array.`;

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (error) {
      this.logger.error('Claude API call failed for recipe generation', error);
      throw new BadGatewayException('Recipe generation service unavailable');
    }

    await this.usageTrackingService.increment(userId, 'recipesGenerated');

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    const parsed = this.parseRecipeResponse(rawText);

    const recipes: Recipe[] = [];
    for (const item of parsed) {
      const recipe = this.recipeRepo.create({
        userId,
        title: item.title,
        description: item.description,
        prepTimeMinutes: item.prepTimeMinutes,
        cookTimeMinutes: item.cookTimeMinutes,
        totalTimeMinutes: item.totalTimeMinutes,
        servings: item.servings,
        difficulty: item.difficulty,
        cuisine: item.cuisine,
        mealType: item.mealType,
        source: 'ai',
        ingredients: item.ingredients ?? [],
        steps: item.steps ?? [],
        tags: item.tags,
        dietaryFlags: item.dietaryFlags,
        nutrition: item.nutrition,
      });
      recipes.push(await this.recipeRepo.save(recipe));
    }

    return recipes;
  }

  async getSavedRecipes(userId: string): Promise<SavedRecipe[]> {
    return this.savedRecipeRepo.find({
      where: { userId },
      relations: ['recipe'],
      order: { savedAt: 'DESC' },
    });
  }

  async saveRecipe(
    userId: string,
    recipeId: string,
    dto?: SaveRecipeDto,
  ): Promise<SavedRecipe> {
    await this.findById(recipeId);

    const existing = await this.savedRecipeRepo.findOne({
      where: { userId, recipeId },
      relations: ['recipe'],
    });

    if (existing) {
      if (dto) {
        Object.assign(existing, dto);
        return this.savedRecipeRepo.save(existing);
      }
      return existing;
    }

    const savedRecipe = this.savedRecipeRepo.create({
      userId,
      recipeId,
      ...dto,
    });

    const saved = await this.savedRecipeRepo.save(savedRecipe);
    return this.savedRecipeRepo.findOne({
      where: { id: saved.id },
      relations: ['recipe'],
    });
  }

  async unsaveRecipe(userId: string, recipeId: string): Promise<void> {
    const savedRecipe = await this.savedRecipeRepo.findOne({
      where: { userId, recipeId },
    });

    if (!savedRecipe) {
      throw new NotFoundException('Saved recipe not found');
    }

    await this.savedRecipeRepo.remove(savedRecipe);
  }

  async updateSavedRecipe(
    userId: string,
    savedRecipeId: string,
    dto: UpdateSavedRecipeDto,
  ): Promise<SavedRecipe> {
    const savedRecipe = await this.savedRecipeRepo.findOne({
      where: { id: savedRecipeId, userId },
      relations: ['recipe'],
    });

    if (!savedRecipe) {
      throw new NotFoundException('Saved recipe not found');
    }

    Object.assign(savedRecipe, dto);
    return this.savedRecipeRepo.save(savedRecipe);
  }

  private parseRecipeResponse(raw: string): any[] {
    let parsed: unknown;

    // Try 1: Direct JSON parse
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try 2: Extract from markdown code block
      const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // fall through
        }
      }

      // Try 3: Find array via regex
      if (!parsed) {
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            // fall through
          }
        }
      }
    }

    if (!Array.isArray(parsed)) {
      this.logger.warn('Failed to parse recipe generation response');
      return [];
    }

    return parsed.filter(
      (item: any) =>
        item &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0 &&
        Array.isArray(item.ingredients) &&
        Array.isArray(item.steps),
    );
  }
}
