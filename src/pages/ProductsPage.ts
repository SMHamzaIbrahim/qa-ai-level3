import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
    // More robust than heading text, as some pages might not have the exact heading
    await this.page.locator('.features_items').waitFor({ state: 'visible' });
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
    const card = this.productCards.first();
    const name = (await card.locator('.productinfo p').textContent())?.trim() ?? '';
    const price = (await card.locator('.productinfo h2').textContent())?.trim() ?? '';
    const id = await card.getAttribute('data-product-id').catch(() => null);
    return { name, price, productId: id ?? '' };
  }

  async addFirstProductToCart(): Promise<ProductSummary> {
    const summary = await this.firstProduct();
    const card = this.productCards.first();
    await card.hover();
    await card.getByText(/add to cart/i).first().click();
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
    await this.productCards.first().getByRole('link', { name: /view product/i }).click();
    await this.waitForReady();
  }

  async openCategory(categoryName: string, subCategory?: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(categoryName, 'i') }).first().click();
    if (subCategory) {
      await this.page.getByRole('link', { name: new RegExp(subCategory, 'i') }).first().click();
    }
    await this.logAction(`opened category ${categoryName}${subCategory ? '/' + subCategory : ''}`);
  }

  async openBrand(brandName: string): Promise<void> {
    // Scope to the brand sidebar to avoid strict mode violations
    await this.page.locator('.brands_products').getByRole('link', { name: new RegExp(brandName, 'i') }).first().click();
    await this.logAction(`opened brand ${brandName}`);
  }
}