/** Parse a price string like "Rs. 500" or "$29.99" into a number. */
export function parsePrice(raw: string): number {
  const amount = raw.match(/\d[\d,]*(?:\.\d+)?/);
  if (!amount) throw new Error(`Cannot parse price from "${raw}"`);
  const n = Number(amount[0].replace(/,/g, ''));
  if (!Number.isFinite(n)) throw new Error(`Cannot parse price from "${raw}"`);
  return n;
}

/** Assert-safe integer comparison for line totals. */
export function expectedLineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

export function expectedCartTotal(lines: Array<{ unitPrice: number; quantity: number }>): number {
  const sum = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  return Math.round(sum * 100) / 100;
}