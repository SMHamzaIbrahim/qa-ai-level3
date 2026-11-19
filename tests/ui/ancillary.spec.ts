import { test, expect } from '../../src/fixtures';
import { ProductsPage } from '../../src/pages/ProductsPage';
import { ProductDetailPage } from '../../src/pages/ProductDetailPage';
import { ContactPage } from '../../src/pages/ContactPage';
import { HomePage } from '../../src/pages/HomePage';
import path from 'path';
import fs from 'fs';

test.describe('Ancillary Features (Reviews, Contact, Subscriptions)', () => {
  test('AE-18: Product review @p1', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.openFirstProductDetail();
    
    const detailPage = new ProductDetailPage(page);
    await detailPage.submitReview('QA Reviewer', 'reviewer@example-test.invalid', 'This is a test review for automation.');
    
    await expect(page.getByText(/thank you for your review/i)).toBeVisible();
  });

  test('AE-19: Contact form upload @p1', async ({ page }) => {
    // Create a dummy file to upload
    const dummyFilePath = path.join(process.cwd(), 'test-results', 'dummy-upload.txt');
    fs.mkdirSync(path.dirname(dummyFilePath), { recursive: true });
    fs.writeFileSync(dummyFilePath, 'This is a dummy file for upload testing.');

    const contactPage = new ContactPage(page);
    await contactPage.open();
    await contactPage.submitContactForm(
      'QA Contact',
      'contact@example-test.invalid',
      'Test Subject',
      'This is a test message.',
      dummyFilePath
    );

    expect(await contactPage.isSuccessVisible()).toBeTruthy();
    
    // Cleanup
    fs.unlinkSync(dummyFilePath);
  });

  test('AE-20: Subscriptions @p2', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.open();
    
    // Scroll to footer subscription
    await page.locator('#susbscribe_email').scrollIntoViewIfNeeded();
    await homePage.subscribe('subscribe@example-test.invalid');
    
    await expect(page.getByText(/you have been successfully subscribed!/i)).toBeVisible();
  });

  test('AE-21: Recommended items @p2', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.open();
    
    const recommendedHeading = page.getByRole('heading', { name: /recommended items/i });
    await recommendedHeading.scrollIntoViewIfNeeded();
    await expect(recommendedHeading).toBeVisible();
    
    // Add a recommended item
    const recommendedSection = page.locator('#recommended-item-carousel');
    await recommendedSection.getByText(/add to cart/i).first().click();
    await expect(page.getByRole('link', { name: /view cart/i })).toBeVisible();
  });
});