import { Test, TestingModule } from '@nestjs/testing';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { StorageLocation, UnitOfMeasure } from '@shared/enums';

const mockPantryService = {
  findAllForUser: jest.fn(),
  create: jest.fn(),
  createBulk: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PantryController', () => {
  let controller: PantryController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PantryController],
      providers: [{ provide: PantryService, useValue: mockPantryService }],
    }).compile();

    controller = module.get<PantryController>(PantryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to PantryService.findAllForUser', async () => {
      const items = [{ id: 'pi-1', displayName: 'Chicken' }];
      mockPantryService.findAllForUser.mockResolvedValue(items);

      const result = await controller.findAll('u1');

      expect(mockPantryService.findAllForUser).toHaveBeenCalledWith('u1');
      expect(result).toEqual(items);
    });
  });

  describe('create', () => {
    it('should delegate to PantryService.create', async () => {
      const dto = {
        foodCacheId: 'fc-1',
        displayName: 'Chicken Breast',
        quantity: 2,
        unit: UnitOfMeasure.Lb,
        storageLocation: StorageLocation.Fridge,
      };
      const created = { id: 'pi-1', userId: 'u1', ...dto };
      mockPantryService.create.mockResolvedValue(created);

      const result = await controller.create('u1', dto);

      expect(mockPantryService.create).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual(created);
    });
  });

  describe('createBulk', () => {
    it('should delegate to PantryService.createBulk', async () => {
      const items = [
        { foodCacheId: 'fc-1', displayName: 'Milk', quantity: 1, unit: UnitOfMeasure.Gallon },
        { foodCacheId: 'fc-2', displayName: 'Eggs', quantity: 12, unit: UnitOfMeasure.Count },
      ];
      const created = items.map((dto, i) => ({ id: `pi-${i}`, userId: 'u1', ...dto }));
      mockPantryService.createBulk.mockResolvedValue(created);

      const result = await controller.createBulk('u1', items);

      expect(mockPantryService.createBulk).toHaveBeenCalledWith('u1', items);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should delegate to PantryService.update', async () => {
      const dto = { quantity: 1, storageLocation: StorageLocation.Freezer };
      const updated = { id: 'pi-1', userId: 'u1', ...dto };
      mockPantryService.update.mockResolvedValue(updated);

      const result = await controller.update('u1', 'pi-1', dto);

      expect(mockPantryService.update).toHaveBeenCalledWith('u1', 'pi-1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delegate to PantryService.remove', async () => {
      mockPantryService.remove.mockResolvedValue(undefined);

      await controller.remove('u1', 'pi-1');

      expect(mockPantryService.remove).toHaveBeenCalledWith('u1', 'pi-1');
    });
  });
});
