import { UnitOfMeasure } from '@shared/enums';

type BaseUnit = UnitOfMeasure.G | UnitOfMeasure.Ml | UnitOfMeasure.Count;

interface BaseConversion {
  quantity: number;
  baseUnit: BaseUnit;
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

const COUNT_UNITS: Set<string> = new Set([
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
  const lower = targetUnit.toLowerCase();

  if (baseUnit === UnitOfMeasure.G && WEIGHT_TO_GRAMS[lower] != null) {
    return baseQty / WEIGHT_TO_GRAMS[lower];
  }

  if (baseUnit === UnitOfMeasure.Ml && VOLUME_TO_ML[lower] != null) {
    return baseQty / VOLUME_TO_ML[lower];
  }

  if (baseUnit === UnitOfMeasure.Count && COUNT_UNITS.has(lower)) {
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
    return { quantity: item.baseQuantity, baseUnit: item.baseUnit as BaseUnit };
  }
  return convertToBase(item.quantity, item.unit);
}

export function convertToBase(
  qty: number,
  unit: string,
): BaseConversion | null {
  const lower = unit.toLowerCase();

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
