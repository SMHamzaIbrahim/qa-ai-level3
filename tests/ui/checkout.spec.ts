import { test, expect } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { PaymentPage } from '../../src/pages/PaymentPage';
import { ProductDetailPage } from '../../src/pages/ProductDetailPage';
import { parsePrice, expectedCartTotal, expectedLineTotal } from '../../src/utils/calculations';
import fs from 'fs';
import path from 'path';

test.describe('Checkout & Orders', () => {
  test('AE-15/16/17: Two-item purchase, addresses, and invoice @p0 @smoke', async ({
    page,
    registerUser,
    newUser,
  }, testInfo) => {
    await registerUser(newUser);

    const productsPage = new ProductsPage(page);
    await productsPage.open();
    const firstProduct = await productsPage.firstProduct();
    await productsPage.openFirstProductDetail();
    const detailPage = new ProductDetailPage(page);
    const firstName = await detailPage.getProductName();
    const firstUnitPrice = parsePrice(await detailPage.getProductPrice());
    expect(firstName).toBe(firstProduct.name);
    await detailPage.addToCart(4);
    await detailPage.continueShoppingFromModal();

    await productsPage.open();
    const secondProduct = await productsPage.addProductAt(1);
    expect(secondProduct.productId).not.toBe(firstProduct.productId);
    await productsPage.viewCartFromModal();

    const cartPage = new CartPage(page);
    const lines = await cartPage.readLines();
    expect(lines).toHaveLength(2);
    const firstLine = lines.find((line) => line.description.includes(firstName));
    const secondLine = lines.find((line) => line.description.includes(secondProduct.name));
    expect(firstLine).toBeDefined();
    expect(secondLine).toBeDefined();
    if (!firstLine || !secondLine) {
      throw new Error('Cart did not contain both selected products');
    }
    expect(firstLine.quantity).toBe(4);
    expect(secondLine.quantity).toBe(1);
    expect(parsePrice(firstLine.unitPrice)).toBeCloseTo(firstUnitPrice, 2);
    expect(parsePrice(firstLine.lineTotal)).toBeCloseTo(
      expectedLineTotal(firstUnitPrice, firstLine.quantity),
      2,
    );
    const secondUnitPrice = parsePrice(secondProduct.price);
    expect(parsePrice(secondLine.unitPrice)).toBeCloseTo(secondUnitPrice, 2);
    expect(parsePrice(secondLine.lineTotal)).toBeCloseTo(
      expectedLineTotal(secondUnitPrice, secondLine.quantity),
      2,
    );
    const expectedTotal = expectedCartTotal(
      lines.map((line) => ({ unitPrice: parsePrice(line.unitPrice), quantity: line.quantity })),
    );
    expect(await cartPage.sumParsedLineTotals()).toBeCloseTo(expectedTotal, 2);

    await cartPage.proceed();

    const checkoutPage = new CheckoutPage(page);
    await expect(checkoutPage.deliveryAddress).toBeVisible();
    const deliveryLines = await checkoutPage.readAddress('delivery');
    const billingLines = await checkoutPage.readAddress('billing');
    for (const address of [deliveryLines, billingLines]) {
      const addressText = address.join(' ');
      for (const expected of [
        newUser.firstName,
        newUser.lastName,
        newUser.address1,
        newUser.address2,
        newUser.city,
        newUser.state,
        newUser.zipcode,
        newUser.country,
      ]) {
        expect(addressText).toContain(expected);
      }
    }
    expect(billingLines).toEqual(deliveryLines);

    await checkoutPage.fillComment('QA Automated Test Order');
    await checkoutPage.submitOrder();

    const paymentPage = new PaymentPage(page);
    await paymentPage.payWithDummyCard(newUser.name);
    await paymentPage.waitForOrderPlaced();
    await expect(page.getByText(/congratulations! your order has been confirmed!/i)).toBeVisible();

    const invoice = await paymentPage.downloadInvoiceFile();
    const stats = fs.statSync(invoice.path);
    expect(stats.size).toBeGreaterThan(0);
    const extension = path.extname(invoice.suggestedFilename).toLowerCase();
    expect(['.txt', '.pdf']).toContain(extension);
    const contents = fs.readFileSync(invoice.path);
    if (extension === '.txt') {
      const invoiceText = contents.toString('utf8');
      expect(invoiceText.toLowerCase()).toContain(newUser.name.toLowerCase());
      expect(invoiceText).toContain(String(expectedTotal));
    } else {
      expect(contents.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    }
    await testInfo.attach('invoice', {
      body: contents,
      contentType: extension === '.pdf' ? 'application/pdf' : 'text/plain',
    });
  });
});