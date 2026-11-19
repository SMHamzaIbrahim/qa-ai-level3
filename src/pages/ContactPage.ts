import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ContactPage extends BasePage {
  readonly name: Locator = this.page.locator('input[data-qa="name"]');
  readonly email: Locator = this.page.locator('input[data-qa="email"]');
  readonly subject: Locator = this.page.locator('input[data-qa="subject"]');
  readonly message: Locator = this.page.locator('textarea[data-qa="message"]');
  readonly file: Locator = this.page.locator('input[name="upload_file"]');
  readonly submit: Locator = this.page.getByRole('button', { name: /submit/i });
  readonly getInTouchHeading: Locator = this.page.getByRole('heading', { name: /get in touch/i });

  async open(): Promise<void> {
    await this.goto('/contact_us');
  }

  async submitContactForm(
    name: string,
    email: string,
    subject: string,
    message: string,
    uploadPath?: string,
  ): Promise<void> {
    await this.name.fill(name);
    await this.email.fill(email);
    await this.subject.fill(subject);
    await this.message.fill(message);
    if (uploadPath) await this.file.setInputFiles(uploadPath);
    
    // The site uses an alert dialog confirmation
    this.page.once('dialog', async (d) => {
      await d.accept();
    });
    
    await this.submit.click();
    await this.logAction('submitted contact form');
  }

  async isSuccessVisible(): Promise<boolean> {
    const success = this.page.locator('.status.alert.alert-success');
    return await success.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  }
}