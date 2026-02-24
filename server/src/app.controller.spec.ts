import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "StockPot API"', () => {
      expect(controller.getHello()).toBe('StockPot API');
    });
  });

  describe('getHealth', () => {
    it('should return { status: "ok" }', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('getRecipes', () => {
    it('should return an array of recipes', () => {
      const result = controller.getRecipes();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });
  });
});
