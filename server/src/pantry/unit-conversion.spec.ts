import { convertToBase } from './unit-conversion';

describe('convertToBase', () => {
  describe('weight → grams', () => {
    it('converts grams (identity)', () => {
      expect(convertToBase(500, 'g')).toEqual({ quantity: 500, baseUnit: 'g' });
    });

    it('converts kg to g', () => {
      expect(convertToBase(2, 'kg')).toEqual({ quantity: 2000, baseUnit: 'g' });
    });

    it('converts oz to g', () => {
      const result = convertToBase(1, 'oz');
      expect(result?.baseUnit).toBe('g');
      expect(result?.quantity).toBeCloseTo(28.3495);
    });

    it('converts lb to g', () => {
      const result = convertToBase(1, 'lb');
      expect(result?.baseUnit).toBe('g');
      expect(result?.quantity).toBeCloseTo(453.592);
    });
  });

  describe('volume → ml', () => {
    it('converts ml (identity)', () => {
      expect(convertToBase(250, 'ml')).toEqual({ quantity: 250, baseUnit: 'ml' });
    });

    it('converts cup to ml', () => {
      const result = convertToBase(1, 'cup');
      expect(result?.baseUnit).toBe('ml');
      expect(result?.quantity).toBeCloseTo(236.588);
    });

    it('converts tbsp to ml', () => {
      const result = convertToBase(1, 'tbsp');
      expect(result?.baseUnit).toBe('ml');
      expect(result?.quantity).toBeCloseTo(14.787);
    });

    it('converts tsp to ml', () => {
      const result = convertToBase(1, 'tsp');
      expect(result?.baseUnit).toBe('ml');
      expect(result?.quantity).toBeCloseTo(4.929);
    });

    it('converts liter to ml', () => {
      expect(convertToBase(1, 'liter')).toEqual({ quantity: 1000, baseUnit: 'ml' });
    });

    it('converts fl_oz to ml', () => {
      const result = convertToBase(1, 'fl_oz');
      expect(result?.baseUnit).toBe('ml');
      expect(result?.quantity).toBeCloseTo(29.574);
    });

    it('converts gallon to ml', () => {
      const result = convertToBase(1, 'gallon');
      expect(result?.baseUnit).toBe('ml');
      expect(result?.quantity).toBeCloseTo(3785.41);
    });
  });

  describe('count units', () => {
    it('converts count (identity)', () => {
      expect(convertToBase(3, 'count')).toEqual({ quantity: 3, baseUnit: 'count' });
    });

    it.each(['bunch', 'clove', 'head', 'slice', 'stick', 'bag', 'can', 'bottle', 'package'])(
      'converts %s to count',
      (unit) => {
        expect(convertToBase(2, unit)).toEqual({ quantity: 2, baseUnit: 'count' });
      },
    );
  });

  describe('incompatible / unknown units', () => {
    it('returns null for unknown units', () => {
      expect(convertToBase(1, 'bushel')).toBeNull();
    });
  });
});
