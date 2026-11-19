import { expect } from '@playwright/test';
import { test } from '../../src/fixtures';

test.describe('API - Products & Search', () => {
  test('AE-06 (API): Get all products list @p0 @smoke', async ({ api }) => {
    const result = await api.getProducts();
    expect(result.httpStatus).toBe(200);
    expect(result.body.responseCode).toBe(200);
    expect(result.body.products.length).toBeGreaterThan(0);

    const firstProduct = result.body.products[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  test('AE-07 (API): Search product @p0', async ({ api }) => {
    const result = await api.searchProducts('Tshirt');
    expect(result.httpStatus).toBe(200);
    expect(result.body.responseCode).toBe(200);
    expect(result.body.products).toBeDefined();
    if (!result.body.products) throw new Error('Successful product search returned no products field');
    expect(result.body.products.length).toBeGreaterThan(0);
  });

  test('AE-08 (API): Search product without parameter (Negative) @p1', async ({ api }) => {
    const result = await api.searchProducts();
    expect(result.httpStatus).toBe(200);
    expect(result.body.responseCode).toBe(400);
    expect(result.body.message).toMatch(/bad request/i);
  });

  test('AE-10 (API): Get all brands list @p1', async ({ api }) => {
    const result = await api.getBrands();
    expect(result.httpStatus).toBe(200);
    expect(result.body.responseCode).toBe(200);
    expect(result.body.brands.length).toBeGreaterThan(0);
  });
});