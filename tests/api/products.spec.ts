import { expect, APIResponse } from '@playwright/test';
import { test as baseTest } from '../../src/fixtures';

const test = baseTest.extend<{}>({});

async function safeJson(response: APIResponse) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Expected JSON but received HTML/Text (Status ${response.status()}):\n${text.substring(0, 100)}...`);
  }
}

test.describe('API - Products & Search', () => {
  test('AE-06 (API): Get all products list @p0 @smoke', async ({ apiContext }) => {
    const response = await apiContext.get('/productsList');
    expect(response.status()).toBe(200);
    
    const body = await safeJson(response);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBeTruthy();
    expect(body.products.length).toBeGreaterThan(0);
    
    const firstProduct = body.products[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  test('AE-07 (API): Search product @p0', async ({ apiContext }) => {
    const response = await apiContext.post('/searchProduct', {
      form: { search_product: 'Tshirt' },
    });
    expect(response.status()).toBe(200);
    
    const body = await safeJson(response);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBeTruthy();
    expect(body.products.length).toBeGreaterThan(0);
  });

  test('AE-08 (API): Search product without parameter (Negative) @p1', async ({ apiContext }) => {
    const response = await apiContext.post('/searchProduct', {
      form: {}, 
    });
    expect(response.status()).toBe(200);
    
    const body = await safeJson(response);
    expect(body.responseCode).toBe(400);
    expect(body.message).toMatch(/bad request/i);
  });

  test('AE-10 (API): Get all brands list @p1', async ({ apiContext }) => {
    const response = await apiContext.get('/brandsList');
    expect(response.status()).toBe(200);
    
    const body = await safeJson(response);
    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.brands)).toBeTruthy();
  });
});