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
import { FoodCacheService } from '../food-cache/food-cache.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
import { SaveRecipeDto } from './dto/save-recipe.dto';
import { UpdateSavedRecipeDto } from './dto/update-saved-recipe.dto';
import { ACTIVE_MODEL } from '../ai-models';
import { PantryStatus, RecipeSource, MessageType } from '@shared/enums';
import { buildRecipeGenerationPrompt } from '../prompts';
import { enrichPantryStatus } from '../pantry/enrich-pantry';
import { extractText, parseArrayFromAI } from '../utils/ai-response';
import { formatPantryForPrompt, buildPantryFoodItems, mapResolvedIngredients, buildRecipeData, ParsedRecipe } from '../utils/recipe-builder';

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
    private readonly foodCacheService: FoodCacheService,
  ) {}

  async findById(recipeId: string, userId?: string): Promise<Recipe> {
    const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (userId && recipe.ingredients?.length) {
      const pantryItems = await this.pantryService.findAllForUser(userId);
      recipe.ingredients = enrichPantryStatus(recipe.ingredients, pantryItems);
    }
    return recipe;
  }

  async checkPantryStatus(
    recipeId: string,
    userId: string,
    scale: number,
  ): Promise<Record<string, PantryStatus>> {
    const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const scaledIngredients = (recipe.ingredients ?? []).map((ing) => ({
      ...ing,
      quantity: ing.quantity * scale,
      baseQuantity: ing.baseQuantity * scale,
    }));

    const pantryItems = await this.pantryService.findAllForUser(userId);
    const enriched = enrichPantryStatus(scaledIngredients, pantryItems);

    const result: Record<string, PantryStatus> = {};
    for (let i = 0; i < enriched.length; i++) {
      result[i] = enriched[i].pantryStatus ?? PantryStatus.None;
    }
    return result;
  }

  async generateRecipes(
    userId: string,
    dto: GenerateRecipeDto,
  ): Promise<Recipe[]> {
    const pantryItems = await this.pantryService.findAllForUser(userId);
    const ingredientList = formatPantryForPrompt(pantryItems);

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

    const prompt = buildRecipeGenerationPrompt(ingredientList, numberOfRecipes, filterBlock);

    let response;
    try {
      response = await this.anthropicService.sendMessage(userId, {
        model: ACTIVE_MODEL,
        maxTokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        messageType: MessageType.RecipeGeneration,
      });
    } catch (error) {
      this.logger.error('Claude API call failed for recipe generation', error);
      throw new BadGatewayException('Recipe generation service unavailable');
    }

    const rawText = extractText(response);

    const rawParsed = parseArrayFromAI<ParsedRecipe>(rawText) ?? [];
    const parsed = rawParsed.filter(
      (item) =>
        item &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0 &&
        Array.isArray(item.ingredients) &&
        Array.isArray(item.steps),
    );

    // Resolve ingredient names to food_cache IDs
    const allIngredientNames = parsed.flatMap(
      (item) => item.ingredients.map((ing) => ing.name),
    );
    const resolvedMap = await this.foodCacheService.resolveIngredientNames(
      allIngredientNames,
      buildPantryFoodItems(pantryItems),
      userId,
    );

    const recipes: Recipe[] = [];
    for (const item of parsed) {
      const resolvedIngredients = mapResolvedIngredients(item.ingredients ?? [], resolvedMap);
      const recipe = this.recipeRepo.create({
        ...buildRecipeData(item, { userId, source: RecipeSource.AI }),
        ingredients: resolvedIngredients,
      });
      recipes.push(await this.recipeRepo.save(recipe));
    }

    // Enrich with pantryStatus for the API response
    for (const recipe of recipes) {
      recipe.ingredients = enrichPantryStatus(recipe.ingredients, pantryItems);
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

}
