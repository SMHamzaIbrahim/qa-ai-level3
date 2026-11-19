import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { waitForProductGridOrQueueFull } from '../utils/siteAvailability';

export interface ProductSummary {
  name: string;
  price: string;
  productId: string;
}

export class ProductsPage extends BasePage {
  readonly searchInput: Locator = this.page.locator('input#search_product');
  readonly searchButton: Locator = this.page.locator('button#submit_search');
  readonly searchedProductsHeading: Locator = this.page.getByRole('heading', { name: /searched products/i });
  readonly allProductsHeading: Locator = this.page.getByRole('heading', { name: /all products/i });
  readonly productCards: Locator = this.page.locator('.features_items .product-image-wrapper');
  readonly viewCartModalLink: Locator = this.page.getByRole('link', { name: /view cart/i });
  readonly continueShopping: Locator = this.page.getByRole('button', { name: /continue shopping/i });

  async open(): Promise<void> {
    await this.goto('/products');
    await this.waitForReady();
  }

  protected async waitForReady(): Promise<void> {
    if (await waitForProductGridOrQueueFull(this.page)) {
      await test.info().attach('public-site-queue-full', {
        body: await this.page.screenshot(),
        contentType: 'image/png',
      });
      test.skip(true, 'The public site displayed its queue-full page; catalog-dependent scenario was not run.');
    }
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await this.logAction(`searched "${term}"`);
  }

  async productCount(): Promise<number> {
    return this.productCards.count();
  }

  async firstProduct(): Promise<ProductSummary> {
    return this.productAt(0);
  }

  async productAt(index: number): Promise<ProductSummary> {
    const card = this.productCards.nth(index);
    const name = (await card.locator('.productinfo p').textContent())?.trim() ?? '';
    const price = (await card.locator('.productinfo h2').textContent())?.trim() ?? '';
    const detailHref = await card.getByRole('link', { name: /view product/i }).getAttribute('href');
    const productId = detailHref?.match(/\/product_details\/([^/?#]+)/)?.[1];
    if (!productId) throw new Error(`Could not read the product ID for "${name}"`);
    return { name, price, productId };
  }

  async addFirstProductToCart(): Promise<ProductSummary> {
    return this.addProductAt(0);
  }

  async addProductAt(index: number): Promise<ProductSummary> {
    const summary = await this.productAt(index);
    const card = this.productCards.nth(index);
    await card.hover();
    await card
      .getByText(/add to cart/i)
      .first()
      .click();
    await this.viewCartModalLink.waitFor({ state: 'visible' });
    await this.logAction(`added to cart: ${summary.name}`);
    return summary;
  }

  async viewCartFromModal(): Promise<void> {
    await this.viewCartModalLink.click();
  }

  async continueShoppingFromModal(): Promise<void> {
    await this.continueShopping.click();
  }

  async openFirstProductDetail(): Promise<void> {
    await this.productCards
      .first()
      .getByRole('link', { name: /view product/i })
      .click();
    await this.page.locator('.product-information h2').waitFor({ state: 'visible' });
  }

  async openCategory(categoryName: string, subCategory?: string): Promise<void> {
    await this.page
      .getByRole('link', { name: new RegExp(categoryName, 'i') })
      .first()
      .click();
    if (subCategory) {
      await this.page
        .getByRole('link', { name: new RegExp(subCategory, 'i') })
        .first()
        .click();
    }
    await this.logAction(`opened category ${categoryName}${subCategory ? '/' + subCategory : ''}`);
  }

  async openBrand(brandName: string): Promise<void> {
    // Scope to the brand sidebar to avoid strict mode violations
    await this.page
      .locator('.brands_products')
      .getByRole('link', { name: new RegExp(brandName, 'i') })
      .first()
      .click();
    await this.logAction(`opened brand ${brandName}`);
  }
}
