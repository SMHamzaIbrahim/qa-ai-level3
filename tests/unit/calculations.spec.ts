import { expect, test } from '@playwright/test';
import { parsePrice } from '../../src/utils/calculations';

test('parses currency punctuation and grouped price amounts', () => {
  expect(parsePrice('Rs. 500')).toBe(500);
  expect(parsePrice('Rs. 2,000')).toBe(2000);
  expect(parsePrice('$29.99')).toBe(29.99);
});
