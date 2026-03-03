const FRACTIONS: Record<string, string> = {
  '0.25': '\u00BC',
  '0.33': '\u2153',
  '0.5': '\u00BD',
  '0.67': '\u2154',
  '0.75': '\u00BE',
};

/**
 * Format a numeric quantity for display — uses vulgar fractions where
 * possible (¼, ½, ¾ …) and strips trailing zeros for everything else.
 */
export function formatQuantity(qty: number): string {
  if (qty === 0) return '0';
  if (Number.isInteger(qty)) return String(qty);

  const whole = Math.floor(qty);
  const frac = qty - whole;
  const fracKey = frac.toFixed(2);
  const fracStr = FRACTIONS[fracKey];

  if (fracStr) {
    return whole > 0 ? `${whole}${fracStr}` : fracStr;
  }

  return qty
    .toFixed(2)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
}
