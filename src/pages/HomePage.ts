import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly logo: Locator = this.page.getByRole('img', { name: /website for automation practice/i }).first();
  readonly featuredItemsHeading: Locator = this.page.getByRole('heading', { name: /features items/i });
  readonly subscriptionEmail: Locator = this.page.locator('#susbscribe_email');
  readonly subscriptionSubmit: Locator = this.page.locator('#subscribe');

  async open(): Promise<void> {
    await this.goto('/');
    await this.logAction('opened home');
  }

  async subscribe(email: string): Promise<void> {
    await this.subscriptionEmail.fill(email);
    await this.subscriptionSubmit.click();
    await this.logAction(`subscribed ${email}`);
  }

  async gotoProducts(): Promise<void> {
    await this.clickNav(/products/i);
  }

  async gotoCart(): Promise<void> {
    await this.clickNav(/cart/i);
  }

  async gotoLogin(): Promise<void> {
    await this.clickNav(/signup \/ login/i);
  }

  async gotoContact(): Promise<void> {
    await this.clickNav(/contact us/i);
  }
}