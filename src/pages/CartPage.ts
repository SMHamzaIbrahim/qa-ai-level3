import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { parsePrice } from '../utils/calculations';

export interface CartLine {
  description: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export class CartPage extends BasePage {
  readonly cartRows: Locator = this.page.locator('#cart_info_table tbody tr');
  readonly proceedToCheckout: Locator = this.page.locator('.check_out');
  readonly emptyCart: Locator = this.page.getByText(/cart is empty/i);

  async open(): Promise<void> {
    await this.goto('/view_cart');
    await this.logAction('opened cart');
  }

  async rowCount(): Promise<number> {
    return this.cartRows.count();
  }

  async readLines(): Promise<CartLine[]> {
    const n = await this.cartRows.count();
    const out: CartLine[] = [];
    for (let i = 0; i < n; i++) {
      const row = this.cartRows.nth(i);
      const description = (await row.locator('.cart_description').innerText()).trim();
      const unitPrice = (await row.locator('.cart_price').innerText()).trim();
      const quantity = Number((await row.locator('.cart_quantity').innerText()).trim());
      const lineTotal = (await row.locator('.cart_total').innerText()).trim();
      out.push({ description, unitPrice, quantity, lineTotal });
    }
    return out;
  }

  async lineCount(): Promise<number> {
    return (await this.readLines()).length;
  }

  async sumParsedLineTotals(): Promise<number> {
    const lines = await this.readLines();
    return Math.round(lines.reduce((a, l) => a + parsePrice(l.lineTotal), 0) * 100) / 100;
  }

  async removeByDescription(description: string): Promise<void> {
    const row = this.cartRows.filter({ hasText: description }).first();
    await row.locator('a.cart_quantity_delete').click();
    await this.logAction(`removed ${description}`);
  }

  async proceed(): Promise<void> {
    await this.proceedToCheckout.click();  
    //this.page.locator('.wrong-button').click(); //to break it
  }
}