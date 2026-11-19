import { expect } from '@playwright/test';
import { test } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';
import { parsePrice } from '../../src/utils/calculations';

test('AE-24: Product data is consistent between UI and API @p1', async ({ api, page }) => {
  const apiResult = await api.getProducts();
  expect(apiResult.body.responseCode).toBe(200);

  const productsPage = new ProductsPage(page);
  await productsPage.open();
  const uiProduct = await productsPage.firstProduct();
  const apiProduct = apiResult.body.products.find(
    (product) => String(product.id) === uiProduct.productId,
  );

  expect(apiProduct, `API product for UI ID ${uiProduct.productId}`).toBeDefined();
  if (!apiProduct) {
    throw new Error(`API did not return UI product ID ${uiProduct.productId}`);
  }
  expect(uiProduct.name).toBe(apiProduct.name);
  expect(parsePrice(uiProduct.price)).toBeCloseTo(parsePrice(String(apiProduct.price)), 2);
});
