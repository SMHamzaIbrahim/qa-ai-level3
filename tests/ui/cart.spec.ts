import { test, expect } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';
import { ProductDetailPage } from '../../src/pages/ProductDetailPage';
import { CartPage } from '../../src/pages/CartPage';
import { parsePrice } from '../../src/utils/calculations';

test.describe('Shopping Cart', () => {
  test('AE-11: Cart multiple items @p0 @smoke', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.addFirstProductToCart();
    await productsPage.continueShoppingFromModal();
    
    await productsPage.productCards.nth(1).hover();
    await productsPage.productCards.nth(1).getByText(/add to cart/i).first().click();
    await productsPage.viewCartFromModal();

    const cartPage = new CartPage(page);
    expect(await cartPage.lineCount()).toBe(2);
  });

  test('AE-12: Quantity calculation @p0', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.openFirstProductDetail();
    
    const detailPage = new ProductDetailPage(page);
    const unitPriceStr = await detailPage.getProductPrice();
    const unitPrice = parsePrice(unitPriceStr);
    
    await detailPage.addToCart(4);
    await detailPage.viewCart();

    const cartPage = new CartPage(page);
    const lines = await cartPage.readLines();
    expect(lines[0].quantity).toBe(4);
    
    const actualLineTotal = parsePrice(lines[0].lineTotal);
    expect(actualLineTotal).toBeCloseTo(unitPrice * 4, 2);
  });

  test('AE-13: Remove from cart @p0', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    const item = await productsPage.addFirstProductToCart();
    await productsPage.viewCartFromModal();

    const cartPage = new CartPage(page);
    expect(await cartPage.lineCount()).toBe(1);
    
    const cleanDesc = item.name.split('\n')[0]; 
    await cartPage.removeByDescription(cleanDesc);
    
    await expect(page.getByText(/cart is empty/i)).toBeVisible();
  });

  test('AE-14: Cart persists on login @p1', async ({ page, registerUser, newUser }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.addFirstProductToCart();
    await productsPage.continueShoppingFromModal();

    await registerUser(newUser);
    
    await page.getByRole('link', { name: /cart/i }).first().click();
    const cartPage = new CartPage(page);
    expect(await cartPage.lineCount()).toBe(1);
  });
});