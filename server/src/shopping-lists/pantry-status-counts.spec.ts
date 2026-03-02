import { countByPantryStatus } from '@shared/pantryStatusCounts';
import { PantryStatus } from '@shared/enums';

describe('countByPantryStatus', () => {
  it('should count None items in the none bucket', () => {
    const items = [
      { pantryStatus: PantryStatus.None },
      { pantryStatus: PantryStatus.None },
    ];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 2, low: 0, enough: 0 });
  });

  it('should count NA items in the none bucket', () => {
    const items = [
      { pantryStatus: PantryStatus.NA },
      { pantryStatus: PantryStatus.NA },
    ];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 2, low: 0, enough: 0 });
  });

  it('should count items without pantryStatus in the none bucket', () => {
    const items = [{}];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 1, low: 0, enough: 0 });
  });

  it('should count Low items in the low bucket', () => {
    const items = [{ pantryStatus: PantryStatus.Low }];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 0, low: 1, enough: 0 });
  });

  it('should count Enough items in the enough bucket', () => {
    const items = [{ pantryStatus: PantryStatus.Enough }];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 0, low: 0, enough: 1 });
  });

  it('should handle mixed statuses including NA', () => {
    const items = [
      { pantryStatus: PantryStatus.None },
      { pantryStatus: PantryStatus.NA },
      { pantryStatus: PantryStatus.Low },
      { pantryStatus: PantryStatus.Enough },
    ];
    const result = countByPantryStatus(items);
    expect(result).toEqual({ none: 2, low: 1, enough: 1 });
  });

  it('should return all zeros for empty array', () => {
    const result = countByPantryStatus([]);
    expect(result).toEqual({ none: 0, low: 0, enough: 0 });
  });
});
