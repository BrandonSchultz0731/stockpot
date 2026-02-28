type BaseUnit = 'g' | 'ml' | 'count';

interface BaseConversion {
  quantity: number;
  baseUnit: BaseUnit;
}

const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  liter: 1000,
  tsp: 4.929,
  tbsp: 14.787,
  fl_oz: 29.574,
  cup: 236.588,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

const COUNT_UNITS: Set<string> = new Set([
  'count',
  'bunch',
  'clove',
  'head',
  'slice',
  'stick',
  'bag',
  'can',
  'bottle',
  'package',
]);

export function convertFromBase(
  baseQty: number,
  baseUnit: string,
  targetUnit: string,
): number | null {
  const lower = targetUnit.toLowerCase();

  if (baseUnit === 'g' && WEIGHT_TO_GRAMS[lower] != null) {
    return baseQty / WEIGHT_TO_GRAMS[lower];
  }

  if (baseUnit === 'ml' && VOLUME_TO_ML[lower] != null) {
    return baseQty / VOLUME_TO_ML[lower];
  }

  if (baseUnit === 'count' && COUNT_UNITS.has(lower)) {
    return baseQty;
  }

  return null;
}

export function convertToBase(
  qty: number,
  unit: string,
): BaseConversion | null {
  const lower = unit.toLowerCase();

  if (WEIGHT_TO_GRAMS[lower] != null) {
    return { quantity: qty * WEIGHT_TO_GRAMS[lower], baseUnit: 'g' };
  }

  if (VOLUME_TO_ML[lower] != null) {
    return { quantity: qty * VOLUME_TO_ML[lower], baseUnit: 'ml' };
  }

  if (COUNT_UNITS.has(lower)) {
    return { quantity: qty, baseUnit: 'count' };
  }

  return null;
}
