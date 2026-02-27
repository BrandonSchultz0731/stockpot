import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FoodCache } from './entities/food-cache.entity';
import { UnitOfMeasure, ShelfLife } from '@shared/enums';
import { AnthropicService } from '../anthropic/anthropic.service';
import { CLAUDE_MODELS } from '../ai-models';
import { buildIngredientResolutionPrompt } from '../prompts';

interface UsdaFoodNutrient {
  nutrientNumber: string;
  value: number;
}

interface UsdaSearchFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  gtinUpc?: string;
  foodNutrients?: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods: UsdaSearchFood[];
  totalHits: number;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    code?: string;
    quantity?: string;
    serving_size?: string;
    nutriments?: Record<string, number>;
  };
}

export interface FoodSearchResult {
  id?: string;
  fdcId?: number;
  name: string;
  usdaDescription?: string;
  usdaDataType?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  nutritionPer100g?: Record<string, number>;
  packageQuantity?: number;
  packageUnit?: string;
  source: 'cache' | 'usda' | 'openfoodfacts';
}

const NUTRIENT_MAP: Record<string, string> = {
  '1008': 'calories',
  '1003': 'protein',
  '1004': 'totalFat',
  '1005': 'carbohydrate',
  '1079': 'fiber',
  '2000': 'totalSugars',
  '1093': 'sodium',
};

const USDA_UNIT_MAP: Record<string, UnitOfMeasure> = {
  oz: UnitOfMeasure.Oz,
  ounce: UnitOfMeasure.Oz,
  ounces: UnitOfMeasure.Oz,
  'fl oz': UnitOfMeasure.FlOz,
  'fluid ounce': UnitOfMeasure.FlOz,
  'fluid ounces': UnitOfMeasure.FlOz,
  lb: UnitOfMeasure.Lb,
  lbs: UnitOfMeasure.Lb,
  pound: UnitOfMeasure.Lb,
  pounds: UnitOfMeasure.Lb,
  g: UnitOfMeasure.G,
  gram: UnitOfMeasure.G,
  grams: UnitOfMeasure.G,
  kg: UnitOfMeasure.Kg,
  kilogram: UnitOfMeasure.Kg,
  kilograms: UnitOfMeasure.Kg,
  ml: UnitOfMeasure.Ml,
  milliliter: UnitOfMeasure.Ml,
  milliliters: UnitOfMeasure.Ml,
  l: UnitOfMeasure.Liter,
  liter: UnitOfMeasure.Liter,
  liters: UnitOfMeasure.Liter,
  cup: UnitOfMeasure.Cup,
  cups: UnitOfMeasure.Cup,
  tbsp: UnitOfMeasure.Tbsp,
  tablespoon: UnitOfMeasure.Tbsp,
  tablespoons: UnitOfMeasure.Tbsp,
  tsp: UnitOfMeasure.Tsp,
  teaspoon: UnitOfMeasure.Tsp,
  teaspoons: UnitOfMeasure.Tsp,
  gallon: UnitOfMeasure.Gallon,
  gallons: UnitOfMeasure.Gallon,
  gal: UnitOfMeasure.Gallon,
  quart: UnitOfMeasure.Quart,
  quarts: UnitOfMeasure.Quart,
  qt: UnitOfMeasure.Quart,
  pint: UnitOfMeasure.Pint,
  pints: UnitOfMeasure.Pint,
  pt: UnitOfMeasure.Pint,
};

@Injectable()
export class FoodCacheService {
  private readonly logger = new Logger(FoodCacheService.name);
  private readonly usdaApiKey: string;
  private readonly usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor(
    @InjectRepository(FoodCache)
    private readonly foodCacheRepo: Repository<FoodCache>,
    private readonly configService: ConfigService,
    private readonly anthropicService: AnthropicService,
  ) {
    this.usdaApiKey = this.configService.get<string>('FOOD_DATA_CENTRAL_API_KEY') || 'DEMO_KEY';
  }

  async search(query: string, limit = 20): Promise<FoodSearchResult[]> {
    const localResults = await this.searchLocal(query, limit);

    const localFdcIds = new Set(
      localResults.filter((r) => r.fdcId).map((r) => r.fdcId),
    );

    let usdaResults: FoodSearchResult[] = [];
    if (localResults.length < limit) {
      usdaResults = await this.searchUsda(query, 50);
      usdaResults = usdaResults.filter((r) => !localFdcIds.has(r.fdcId));
    }

    const combined = [...localResults, ...usdaResults];
    const dedupedAndRanked = this.dedupeAndRank(combined, query);
    return dedupedAndRanked.slice(0, limit);
  }

  async resolveIngredientNames(
    ingredientNames: string[],
    pantryFoodItems: { foodCacheId: string; displayName: string }[],
    userId: string,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (ingredientNames.length === 0) return result;

    // 1. Deduplicate ingredient names (case-insensitive)
    const uniqueNames = new Map<string, string>();
    for (const name of ingredientNames) {
      const lower = name.toLowerCase();
      if (!uniqueNames.has(lower)) {
        uniqueNames.set(lower, name);
      }
    }

    // 2. Gather candidates for each unique name
    const unresolvedNames: string[] = [];
    const allCandidates = new Map<string, { id: string; name: string }>();

    // Build pantry candidate pool by foodCacheId
    const pantryById = new Map<string, string>();
    for (const item of pantryFoodItems) {
      pantryById.set(item.foodCacheId, item.displayName);
    }

    for (const [lower, originalName] of uniqueNames) {
      // Search local food_cache for matches
      const localResults = await this.searchLocal(originalName, 3);

      // Combine local results with pantry items
      const candidatePool = new Map<string, string>();
      for (const r of localResults) {
        if (r.id) candidatePool.set(r.id, r.name);
      }
      for (const item of pantryFoodItems) {
        if (!candidatePool.has(item.foodCacheId)) {
          candidatePool.set(item.foodCacheId, item.displayName);
        }
      }

      // Check for exact case-insensitive match
      let exactMatch: string | null = null;
      for (const [id, name] of candidatePool) {
        if (name.toLowerCase() === lower) {
          exactMatch = id;
          break;
        }
      }

      if (exactMatch) {
        result.set(lower, exactMatch);
      } else {
        unresolvedNames.push(originalName);
        // Add candidates to the global pool for the AI call
        for (const [id, name] of candidatePool) {
          allCandidates.set(id, { id, name });
        }
      }
    }

    // 3. AI batch resolution for unresolved names
    const aiResolved = new Map<string, string>();
    if (unresolvedNames.length > 0 && allCandidates.size > 0) {
      const candidateList = Array.from(allCandidates.values());
      const prompt = buildIngredientResolutionPrompt(unresolvedNames, candidateList);

      try {
        const response = await this.anthropicService.sendMessage(userId, {
          model: CLAUDE_MODELS['haiku-4.5'],
          maxTokens: 1024,
          messages: [{ role: 'user', content: prompt }],
          messageType: 'ingredient-resolution',
        });

        const rawText =
          response.content[0]?.type === 'text' ? response.content[0].text : '';
        let parsed: Record<string, string> = {};
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const objectMatch = rawText.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            try {
              parsed = JSON.parse(objectMatch[0]);
            } catch {
              // fall through
            }
          }
        }

        for (const [name, id] of Object.entries(parsed)) {
          if (id && id !== 'NONE') {
            aiResolved.set(name.toLowerCase(), id);
          }
        }
      } catch (error) {
        this.logger.error('AI ingredient resolution failed', error);
      }
    }

    // Merge AI results
    for (const [lower, id] of aiResolved) {
      result.set(lower, id);
    }

    // 4. Create food_cache entries for still-unresolved names
    for (const [lower, originalName] of uniqueNames) {
      if (!result.has(lower)) {
        const cached = await this.cacheUsdaFood({
          name: originalName,
          source: 'cache',
        });
        result.set(lower, cached.id);
      }
    }

    return result;
  }

  async searchLocal(query: string, limit: number): Promise<FoodSearchResult[]> {
    const results = await this.foodCacheRepo.find({
      where: [
        { name: ILike(`%${query}%`), usdaDataType: ILike('Foundation') },
        { name: ILike(`%${query}%`), usdaDataType: ILike('SR Legacy') },
        { usdaDescription: ILike(`%${query}%`), usdaDataType: ILike('Foundation') },
        { usdaDescription: ILike(`%${query}%`), usdaDataType: ILike('SR Legacy') },
        // Include items with no data type (user-created / non-USDA)
        { name: ILike(`%${query}%`), usdaDataType: IsNull() },
      ],
      take: limit,
      order: { name: 'ASC' },
    });

    return results.map((r) => ({
      id: r.id,
      fdcId: r.fdcId,
      name: r.name,
      usdaDescription: r.usdaDescription,
      usdaDataType: r.usdaDataType,
      category: r.category,
      brand: r.brand,
      barcode: r.barcode,
      nutritionPer100g: r.nutritionPer100g,
      source: 'cache' as const,
    }));
  }

  async searchUsda(query: string, limit: number): Promise<FoodSearchResult[]> {
    try {
      const params = new URLSearchParams({
        query,
        pageSize: String(Math.min(limit, 50)),
        dataType: 'SR Legacy,Foundation',
        api_key: this.usdaApiKey,
      });

      const response = await fetch(
        `${this.usdaBaseUrl}/foods/search?${params.toString()}`,
      );

      if (!response.ok) {
        this.logger.warn(
          `USDA API returned ${response.status}: ${response.statusText}`,
        );
        return [];
      }

      const data: UsdaSearchResponse = await response.json();

      return data.foods.map((food) => ({
        fdcId: food.fdcId,
        name: this.cleanFoodName(food.description),
        usdaDescription: food.description,
        usdaDataType: food.dataType,
        brand: food.brandOwner || null,
        barcode: food.gtinUpc || null,
        nutritionPer100g: this.extractNutrition(food.foodNutrients),
        source: 'usda' as const,
      }));
    } catch (error) {
      this.logger.error('USDA API search failed', error);
      return [];
    }
  }

  async getShelfLife(foodCacheId: string): Promise<ShelfLife | null> {
    const entry = await this.foodCacheRepo.findOne({
      where: { id: foodCacheId },
      select: ['id', 'shelfLife'],
    });
    return entry?.shelfLife ?? null;
  }

  async updateShelfLife(foodCacheId: string, shelfLife: ShelfLife): Promise<void> {
    // Only write if currently null to avoid overwriting user-corrected data
    await this.foodCacheRepo
      .createQueryBuilder()
      .update(FoodCache)
      .set({ shelfLife })
      .where('id = :id AND shelf_life IS NULL', { id: foodCacheId })
      .execute();
  }

  async getCategory(foodCacheId: string): Promise<string | null> {
    const entry = await this.foodCacheRepo.findOne({
      where: { id: foodCacheId },
      select: ['id', 'category'],
    });
    return entry?.category ?? null;
  }

  async updateCategory(foodCacheId: string, category: string): Promise<void> {
    // Only write if currently null to avoid overwriting user-corrected data
    await this.foodCacheRepo
      .createQueryBuilder()
      .update(FoodCache)
      .set({ category })
      .where('id = :id AND category IS NULL', { id: foodCacheId })
      .execute();
  }

  async findById(id: string): Promise<FoodCache | null> {
    return this.foodCacheRepo.findOne({ where: { id } });
  }

  async findByFdcId(fdcId: number): Promise<FoodCache | null> {
    return this.foodCacheRepo.findOne({ where: { fdcId } });
  }

  async findByBarcode(barcode: string): Promise<FoodSearchResult | null> {
    const cached = await this.foodCacheRepo.findOne({ where: { barcode } });
    if (cached) {
      return {
        id: cached.id,
        fdcId: cached.fdcId,
        name: cached.name,
        usdaDescription: cached.usdaDescription,
        usdaDataType: cached.usdaDataType,
        category: cached.category,
        brand: cached.brand,
        barcode: cached.barcode,
        nutritionPer100g: cached.nutritionPer100g,
        source: 'cache',
      };
    }

    return this.searchOpenFoodFacts(barcode);
  }

  private async searchOpenFoodFacts(
    barcode: string,
  ): Promise<FoodSearchResult | null> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,code,quantity,serving_size,nutriments`,
      );

      if (!response.ok) {
        this.logger.warn(
          `Open Food Facts returned ${response.status} for barcode ${barcode}`,
        );
        return null;
      }

      const data: OpenFoodFactsResponse = await response.json();
      if (data.status !== 1 || !data.product?.product_name) return null;

      const product = data.product;

      const result: FoodSearchResult = {
        name: product.product_name,
        brand: product.brands || null,
        barcode: product.code || barcode,
        nutritionPer100g: this.extractOffNutrition(product.nutriments),
        source: 'openfoodfacts',
      };

      // Parse package quantity from the quantity field (e.g. "200 ml", "500g")
      if (product.quantity) {
        const parsed = this.parseWeightString(product.quantity);
        if (parsed) {
          result.packageQuantity = parsed.quantity;
          result.packageUnit = parsed.unit;
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Open Food Facts barcode search failed', error);
      return null;
    }
  }

  async cacheUsdaFood(usdaFood: FoodSearchResult): Promise<FoodCache> {
    if (usdaFood.fdcId) {
      const existing = await this.findByFdcId(usdaFood.fdcId);
      if (existing) return existing;
    }

    const entity = this.foodCacheRepo.create({
      fdcId: usdaFood.fdcId,
      name: usdaFood.name,
      usdaDescription: usdaFood.usdaDescription,
      usdaDataType: usdaFood.usdaDataType,
      brand: usdaFood.brand,
      barcode: usdaFood.barcode,
      nutritionPer100g: usdaFood.nutritionPer100g,
    });

    return this.foodCacheRepo.save(entity);
  }

  /**
   * Builds a user-friendly display name from a USDA description.
   *
   * USDA descriptions look like:
   *   "Milk, whole, 3.25% milkfat"
   *   "Cheese, cheddar, sharp"
   *   "Apples, raw, fuji, with skin"
   *
   * We keep the base food + meaningful qualifiers (variety, type, style)
   * but drop technical details (nutrient percentages, preparation notes).
   */
  private cleanFoodName(description: string): string {
    const parts = description.split(',').map((p) => p.trim());

    // Always keep the first segment (the food itself)
    const kept = [parts[0]];

    // Patterns to drop: percentages, "raw", "with skin", "NFS", etc.
    const dropPatterns =
      /^\d+%|milkfat|with skin|without skin|raw|cooked|unprepared|prepared|NFS|not specified|USDA/i;

    for (let i = 1; i < parts.length && i <= 2; i++) {
      if (!dropPatterns.test(parts[i])) {
        kept.push(parts[i]);
      }
    }

    return kept
      .join(', ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Deduplicates results by cleaned name and ranks them:
   * 1. Prefer Foundation > SR Legacy > other
   * 2. Prefer items already in cache (have an id)
   * 3. Prefix matches before substring matches
   */
  private dedupeAndRank(
    results: FoodSearchResult[],
    query: string,
  ): FoodSearchResult[] {
    const lowerQuery = query.toLowerCase();

    // Group by cleaned name, keeping the best entry per group
    const byName = new Map<string, FoodSearchResult>();
    for (const result of results) {
      const key = result.name.toLowerCase();
      const existing = byName.get(key);
      if (!existing || this.resultPriority(result) > this.resultPriority(existing)) {
        byName.set(key, result);
      }
    }

    const unique = Array.from(byName.values());

    // Sort: prefix matches first, then alphabetical
    unique.sort((a, b) => {
      const aPrefix = a.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bPrefix = b.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      return a.name.localeCompare(b.name);
    });

    return unique;
  }

  private resultPriority(result: FoodSearchResult): number {
    let score = 0;
    if (result.id) score += 10; // already cached
    if (result.usdaDataType === 'Foundation') score += 2;
    else if (result.usdaDataType === 'SR Legacy') score += 1;
    return score;
  }

  private parseWeightSegment(
    segment: string,
  ): { quantity: number; unit: UnitOfMeasure } | null {
    const match = segment.trim().match(/^([\d.]+)\s*(.+)$/);
    if (!match) return null;

    const quantity = parseFloat(match[1]);
    if (isNaN(quantity) || quantity <= 0) return null;

    const unitStr = match[2].trim().replace(/\.$/, '').toLowerCase();
    const unit = USDA_UNIT_MAP[unitStr];
    if (!unit) return null;

    return { quantity, unit };
  }

  private parseWeightString(
    raw: string,
  ): { quantity: number; unit: UnitOfMeasure } | null {
    const segments = raw.split('/');
    for (const segment of segments) {
      const parsed = this.parseWeightSegment(segment);
      if (parsed) return parsed;
    }
    return null;
  }

  private extractNutrition(
    nutrients?: UsdaFoodNutrient[],
  ): Record<string, number> | null {
    if (!nutrients?.length) return null;

    const result: Record<string, number> = {};
    for (const nutrient of nutrients) {
      const key = NUTRIENT_MAP[nutrient.nutrientNumber];
      if (key) {
        result[key] = nutrient.value;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private extractOffNutrition(
    nutriments?: Record<string, number>,
  ): Record<string, number> | null {
    if (!nutriments) return null;

    const map: Record<string, string> = {
      'energy-kcal_100g': 'calories',
      proteins_100g: 'protein',
      fat_100g: 'totalFat',
      carbohydrates_100g: 'carbohydrate',
      fiber_100g: 'fiber',
      sugars_100g: 'totalSugars',
      sodium_100g: 'sodium',
    };

    const result: Record<string, number> = {};
    for (const [offKey, ourKey] of Object.entries(map)) {
      if (nutriments[offKey] != null) {
        result[ourKey] = nutriments[offKey];
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}
