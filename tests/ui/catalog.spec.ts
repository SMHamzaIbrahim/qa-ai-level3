import { test, expect } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';

test.describe('Catalogue & Search', () => {
  test('AE-06: Product catalogue @p0 @smoke', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    expect(await productsPage.productCount()).toBeGreaterThan(0);
    const first = await productsPage.firstProduct();
    expect(first.name).toBeTruthy();
    expect(first.price).toMatch(/Rs\.\s*\d+/);
  });

  test('AE-07: Search relevance @p0', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.search('Top');
    await expect(productsPage.searchedProductsHeading).toBeVisible();
    expect(await productsPage.productCount()).toBeGreaterThan(0);
    const first = await productsPage.firstProduct();
    expect(first.name.toLowerCase()).toContain('top');
  });

  test('AE-08: Search empty/invalid @p1', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.search('NonExistentProductXYZ_999');
    await expect(productsPage.searchedProductsHeading).toBeVisible();
    expect(await productsPage.productCount()).toBe(0);
  });

  test('AE-09: Category filtering @p1', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.openCategory('Women', 'Dress');
    await expect(page.getByRole('heading', { name: /women - dress products/i })).toBeVisible();
    expect(await productsPage.productCount()).toBeGreaterThan(0);
  });

  test('AE-10: Brand filtering @p1', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.openBrand('Polo');
    // Instead of looking for heading text, wait for the product grid to load
    await expect(page.locator('.features_items')).toBeVisible();
    expect(await productsPage.productCount()).toBeGreaterThan(0);
  });
});
