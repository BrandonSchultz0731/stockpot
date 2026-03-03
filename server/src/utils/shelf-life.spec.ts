import { parseShelfLife } from './shelf-life';

describe('parseShelfLife', () => {
  it('parses valid shelf life with all locations', () => {
    expect(parseShelfLife({ Fridge: 7, Freezer: 90, Pantry: 30 })).toEqual({
      Fridge: 7,
      Freezer: 90,
      Pantry: 30,
    });
  });

  it('rounds fractional values', () => {
    expect(parseShelfLife({ Fridge: 7.6 })).toEqual({ Fridge: 8 });
  });

  it('ignores non-positive values', () => {
    expect(parseShelfLife({ Fridge: 0, Freezer: -5, Pantry: 10 })).toEqual({
      Pantry: 10,
    });
  });

  it('ignores non-numeric values', () => {
    expect(parseShelfLife({ Fridge: 'seven', Pantry: 10 })).toEqual({
      Pantry: 10,
    });
  });

  it('ignores unknown keys', () => {
    expect(parseShelfLife({ Fridge: 7, SomeOther: 99 })).toEqual({
      Fridge: 7,
    });
  });

  it('returns undefined for null input', () => {
    expect(parseShelfLife(null)).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(parseShelfLife('string')).toBeUndefined();
  });

  it('returns undefined when no valid locations found', () => {
    expect(parseShelfLife({ UnknownKey: 5 })).toBeUndefined();
  });

  it('handles string numbers via Number() coercion', () => {
    expect(parseShelfLife({ Fridge: '14' })).toEqual({ Fridge: 14 });
  });
});
