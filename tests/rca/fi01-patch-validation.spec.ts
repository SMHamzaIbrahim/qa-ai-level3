import { expect, test } from '@playwright/test';
import { classifyFailure } from '../../tools/rca/analyze';
import { expectedCartTotal } from '../../src/utils/calculations';

test('FI-01: cart total assertion matches the observed total', async ({ page }, testInfo) => {
  const observedTotal = expectedCartTotal([{ unitPrice: 2, quantity: 2 }]);
  const expectedTotal = 3;

  await page.setContent(`<main><h1 data-testid="cart-total">${observedTotal}</h1></main>`);
  const displayedTotal = Number(await page.getByTestId('cart-total').textContent());
  await testInfo.attach('fi-01-patch-before.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  try {
    expect(displayedTotal).toBe(expectedTotal);
  } catch (error) {
    const record = classifyFailure({
      scenarioId: 'FI-01',
      testTitle: 'FI-01: wrong cart total expectation',
      errorMessage: error instanceof Error ? error.message : String(error),
      stackTrace: 'Controlled FI-01 assertion on an isolated local page.',
      status: 'unexpected',
      retryCount: 0,
      faultInjectionId: 'FI-01',
      commitSha: process.env.GITHUB_SHA,
    });

    await testInfo.attach('fi-01-rca-hypothesis.json', {
      body: JSON.stringify(record, null, 2),
      contentType: 'application/json',
    });
    throw error;
  }
});
