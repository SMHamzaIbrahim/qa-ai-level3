import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PaymentPage extends BasePage {
  readonly nameOnCard: Locator = this.page.locator('input[data-qa="name-on-card"]');
  readonly cardNumber: Locator = this.page.locator('input[data-qa="card-number"]');
  readonly cvc: Locator = this.page.locator('input[data-qa="cvc"]');
  readonly expiryMonth: Locator = this.page.locator('input[data-qa="expiry-month"]');
  readonly expiryYear: Locator = this.page.locator('input[data-qa="expiry-year"]');
  readonly payButton: Locator = this.page.getByRole('button', { name: /pay and confirm order/i });
  readonly orderPlacedHeading: Locator = this.page.getByText(/order placed!/i);
  readonly downloadInvoice: Locator = this.page.getByRole('link', { name: /download invoice/i });
  readonly continueButton: Locator = this.page.getByRole('link', { name: /continue/i });

  /**
   * Fill ONLY dummy test-card details. These are invented values valid only on this
   * practice site — never real card data, never personal data.
   */
  async payWithDummyCard(nameOnCard: string): Promise<void> {
    await this.nameOnCard.waitFor({ state: 'visible' });
    await this.nameOnCard.fill(nameOnCard);
    await this.cardNumber.fill('4111 1111 1111 1111');
    await this.cvc.fill('123');
    await this.expiryMonth.fill('12');
    await this.expiryYear.fill('2030');
    await this.payButton.click();
    await this.logAction('paid with dummy card');
  }

  async waitForOrderPlaced(): Promise<void> {
    await this.orderPlacedHeading.waitFor({ state: 'visible' });
  }

  async downloadInvoiceFile(): Promise<{ path: string; suggestedFilename: string }> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.downloadInvoice.click()]);
    const path = await download.path();
    if (!path) throw new Error('Invoice download returned no path');
    const suggestedFilename = download.suggestedFilename();
    await this.logAction(`downloaded invoice ${suggestedFilename}`);
    return { path, suggestedFilename };
  }
}
