import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "StockPot API"', () => {
      expect(service.getHello()).toBe('StockPot API');
    });
  });

  describe('getRecipes', () => {
    it('should return an array of recipes', () => {
      const recipes = service.getRecipes();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBe(3);
    });

    it('should return recipes with required fields', () => {
      const recipes = service.getRecipes();
      for (const recipe of recipes) {
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('name');
        expect(recipe).toHaveProperty('description');
        expect(recipe).toHaveProperty('prepTime');
        expect(recipe).toHaveProperty('cookTime');
      }
    });
  });
});
