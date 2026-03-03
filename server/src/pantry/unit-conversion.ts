import { UnitOfMeasure } from '@shared/enums';

type BaseUnit = UnitOfMeasure.G | UnitOfMeasure.Ml | UnitOfMeasure.Count;

interface BaseConversion {
  quantity: number;
  baseUnit: BaseUnit;
}

/** Map common aliases and plurals to canonical UnitOfMeasure values */
const UNIT_ALIASES: Record<string, string> = {
  cups: UnitOfMeasure.Cup,
  tbsps: UnitOfMeasure.Tbsp,
  tablespoon: UnitOfMeasure.Tbsp,
  tablespoons: UnitOfMeasure.Tbsp,
  tsps: UnitOfMeasure.Tsp,
  teaspoon: UnitOfMeasure.Tsp,
  teaspoons: UnitOfMeasure.Tsp,
  liters: UnitOfMeasure.Liter,
  litres: UnitOfMeasure.Liter,
  litre: UnitOfMeasure.Liter,
  milliliters: UnitOfMeasure.Ml,
  millilitres: UnitOfMeasure.Ml,
  milliliter: UnitOfMeasure.Ml,
  millilitre: UnitOfMeasure.Ml,
  grams: UnitOfMeasure.G,
  gram: UnitOfMeasure.G,
  kilograms: UnitOfMeasure.Kg,
  kilogram: UnitOfMeasure.Kg,
  ounces: UnitOfMeasure.Oz,
  ounce: UnitOfMeasure.Oz,
  pounds: UnitOfMeasure.Lb,
  pound: UnitOfMeasure.Lb,
  lbs: UnitOfMeasure.Lb,
  pints: UnitOfMeasure.Pint,
  quarts: UnitOfMeasure.Quart,
  gallons: UnitOfMeasure.Gallon,
  cloves: UnitOfMeasure.Clove,
  heads: UnitOfMeasure.Head,
  slices: UnitOfMeasure.Slice,
  sticks: UnitOfMeasure.Stick,
  bags: UnitOfMeasure.Bag,
  cans: UnitOfMeasure.Can,
  bottles: UnitOfMeasure.Bottle,
  packages: UnitOfMeasure.Package,
  bunches: UnitOfMeasure.Bunch,
};

export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase();
  return UNIT_ALIASES[lower] ?? lower;
}

const WEIGHT_TO_GRAMS: Record<string, number> = {
  [UnitOfMeasure.G]: 1,
  [UnitOfMeasure.Kg]: 1000,
  [UnitOfMeasure.Oz]: 28.3495,
  [UnitOfMeasure.Lb]: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  [UnitOfMeasure.Ml]: 1,
  [UnitOfMeasure.Liter]: 1000,
  [UnitOfMeasure.Tsp]: 4.929,
  [UnitOfMeasure.Tbsp]: 14.787,
  [UnitOfMeasure.FlOz]: 29.574,
  [UnitOfMeasure.Cup]: 236.588,
  [UnitOfMeasure.Pint]: 473.176,
  [UnitOfMeasure.Quart]: 946.353,
  [UnitOfMeasure.Gallon]: 3785.41,
};

export const COUNT_UNITS: Set<string> = new Set([
  UnitOfMeasure.Count,
  UnitOfMeasure.Bunch,
  UnitOfMeasure.Clove,
  UnitOfMeasure.Head,
  UnitOfMeasure.Slice,
  UnitOfMeasure.Stick,
  UnitOfMeasure.Bag,
  UnitOfMeasure.Can,
  UnitOfMeasure.Bottle,
  UnitOfMeasure.Package,
]);

export function convertFromBase(
  baseQty: number,
  baseUnit: string,
  targetUnit: string,
): number | null {
  const lowerBase = normalizeUnit(baseUnit);
  const lowerTarget = normalizeUnit(targetUnit);

  if (lowerBase === UnitOfMeasure.G && WEIGHT_TO_GRAMS[lowerTarget] != null) {
    return baseQty / WEIGHT_TO_GRAMS[lowerTarget];
  }

  if (lowerBase === UnitOfMeasure.Ml && VOLUME_TO_ML[lowerTarget] != null) {
    return baseQty / VOLUME_TO_ML[lowerTarget];
  }

  if (lowerBase === UnitOfMeasure.Count && COUNT_UNITS.has(lowerTarget)) {
    return baseQty;
  }

  return null;
}

/**
 * Resolve the base quantity/unit for an item — prefer AI-normalized values,
 * fall back to static conversion of the item's own quantity/unit.
 */
export function resolveBaseQuantity(
  item: { quantity: number; unit: string; baseQuantity?: number; baseUnit?: string },
): BaseConversion | null {
  if (item.baseQuantity && item.baseUnit) {
    return { quantity: item.baseQuantity, baseUnit: normalizeUnit(item.baseUnit) as BaseUnit };
  }
  return convertToBase(item.quantity, item.unit);
}

export function convertToBase(
  qty: number,
  unit: string,
): BaseConversion | null {
  const lower = normalizeUnit(unit);

  if (WEIGHT_TO_GRAMS[lower] != null) {
    return { quantity: qty * WEIGHT_TO_GRAMS[lower], baseUnit: UnitOfMeasure.G };
  }

  if (VOLUME_TO_ML[lower] != null) {
    return { quantity: qty * VOLUME_TO_ML[lower], baseUnit: UnitOfMeasure.Ml };
  }

  if (COUNT_UNITS.has(lower)) {
    return { quantity: qty, baseUnit: UnitOfMeasure.Count };
  }

  return null;
}
