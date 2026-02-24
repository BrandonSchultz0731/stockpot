import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FoodCache } from './entities/food-cache.entity';

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
  source: 'cache' | 'usda';
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

@Injectable()
export class FoodCacheService {
  private readonly logger = new Logger(FoodCacheService.name);
  private readonly usdaApiKey: string;
  private readonly usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor(
    @InjectRepository(FoodCache)
    private readonly foodCacheRepo: Repository<FoodCache>,
    private readonly configService: ConfigService,
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

    const usdaResults = await this.searchUsda(barcode, 5);
    const match = usdaResults.find((r) => r.barcode === barcode);
    return match || null;
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
}
