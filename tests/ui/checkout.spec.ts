import { test, expect } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { PaymentPage } from '../../src/pages/PaymentPage';
import fs from 'fs';

test.describe('Checkout & Orders', () => {
  test('AE-15 & AE-16: End-to-end order and Address consistency @p0 @smoke', async ({ page, registerUser, newUser }) => {
    // 1. Precondition: registered user
    await registerUser(newUser);
    
    // 2. Add items
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.addFirstProductToCart();
    await productsPage.viewCartFromModal();

    // 3. Proceed to checkout
    const cartPage = new CartPage(page);
    await cartPage.proceed();

    const checkoutPage = new CheckoutPage(page);
    expect(await checkoutPage.isOnCheckout()).toBeTruthy();

    // 4. Verify Address (AE-16)
    const deliveryLines = await checkoutPage.readAddress('delivery');
    const billingLines = await checkoutPage.readAddress('billing');
    
    const addressText = deliveryLines.join(' ');
    expect(addressText).toContain(newUser.firstName);
    expect(addressText).toContain(newUser.lastName);
    expect(addressText).toContain(newUser.address1);
    expect(addressText).toContain(newUser.city);
    
    expect(billingLines.join(' ')).toEqual(addressText);

    // 5. Place order
    await checkoutPage.fillComment('QA Automated Test Order');
    await checkoutPage.submitOrder();

    // 6. Payment
    const paymentPage = new PaymentPage(page);
    await paymentPage.payWithDummyCard(newUser.name);
    await paymentPage.waitForOrderPlaced();
    await expect(page.getByText(/congratulations! your order has been confirmed!/i)).toBeVisible();
  });

  test('AE-17: Invoice download @p1', async ({ page, registerUser, newUser }) => {
    await registerUser(newUser);
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.addFirstProductToCart();
    await productsPage.viewCartFromModal();
    
    const cartPage = new CartPage(page);
    await cartPage.proceed();
    
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.submitOrder();
    
    const paymentPage = new PaymentPage(page);
    await paymentPage.payWithDummyCard(newUser.name);
    await paymentPage.waitForOrderPlaced();

    // Download invoice
    const downloadPath = await paymentPage.downloadInvoiceFile();
    const stats = fs.statSync(downloadPath);
    
    expect(stats.size).toBeGreaterThan(0);
    expect(downloadPath).toMatch(/\.txt|\.pdf/i);
  });
});