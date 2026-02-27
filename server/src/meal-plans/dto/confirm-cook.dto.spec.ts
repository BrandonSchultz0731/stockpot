import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConfirmCookDto } from './confirm-cook.dto';

function createDto(data: any): ConfirmCookDto {
  return plainToInstance(ConfirmCookDto, data);
}

describe('ConfirmCookDto', () => {
  it('should pass with valid deductions array', async () => {
    const dto = createDto({
      deductions: [
        { pantryItemId: 'pi-1', deductQuantity: 2, deductUnit: 'count' },
        { pantryItemId: 'pi-2', deductQuantity: 0.25, deductUnit: 'bottle' },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with empty deductions array', async () => {
    const dto = createDto({ deductions: [] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass with zero deductQuantity', async () => {
    const dto = createDto({
      deductions: [
        { pantryItemId: 'pi-1', deductQuantity: 0, deductUnit: 'count' },
      ],
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when deductions is not an array', async () => {
    const dto = createDto({ deductions: 'not-an-array' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when deductions is missing', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when deduction item has negative quantity', async () => {
    const dto = createDto({
      deductions: [
        { pantryItemId: 'pi-1', deductQuantity: -1, deductUnit: 'count' },
      ],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when deduction item is missing pantryItemId', async () => {
    const dto = createDto({
      deductions: [{ deductQuantity: 2, deductUnit: 'count' }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when deduction item is missing deductQuantity', async () => {
    const dto = createDto({
      deductions: [{ pantryItemId: 'pi-1', deductUnit: 'count' }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when deduction item is missing deductUnit', async () => {
    const dto = createDto({
      deductions: [{ pantryItemId: 'pi-1', deductQuantity: 2 }],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
